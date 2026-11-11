import express, { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/config/env";
import { database } from "@/db/client";
import { message, webhookEvent } from "@/db/schema";
import { verifyMetaSignature } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { increment } from "@/lib/stats";
import {
  enqueueInboundMessage,
  type InboundMessageJob,
} from "@/queues/whatsapp.queue";

// Only the fields Vera uses; everything else in Meta's payload is ignored.
const payloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messages: z
              .array(
                z.object({
                  id: z.string(),
                  from: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
            statuses: z
              .array(z.object({ id: z.string(), status: z.string() }))
              .optional(),
          }),
        }),
      ),
    }),
  ),
});

export type ParsedWebhook = {
  messages: Omit<InboundMessageJob, "eventId">[];
  statuses: { messageId: string; status: string }[];
};

export function parseWebhook(body: unknown): ParsedWebhook | null {
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success || parsed.data.object !== "whatsapp_business_account")
    return null;
  const result: ParsedWebhook = { messages: [], statuses: [] };
  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;
      for (const m of change.value.messages ?? []) {
        result.messages.push({
          messageId: m.id,
          from: m.from,
          type: m.type,
          text: m.type === "text" ? (m.text?.body ?? null) : null,
          receivedAt: new Date(Number(m.timestamp) * 1000).toISOString(),
        });
      }
      for (const s of change.value.statuses ?? []) {
        result.statuses.push({ messageId: s.id, status: s.status });
      }
    }
  }
  return result;
}

/** Records the event once; returns its id only the first time Meta delivers it. */
async function recordEvent(
  kind: "message" | "status",
  externalId: string,
  messageType?: string,
) {
  const [row] = await database()
    .insert(webhookEvent)
    .values({
      id: crypto.randomUUID(),
      source: "whatsapp",
      kind,
      externalId,
      messageType,
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvent.id });
  return row?.id;
}

async function handlePayload(parsed: ParsedWebhook) {
  for (const inbound of parsed.messages) {
    const eventId = await recordEvent(
      "message",
      inbound.messageId,
      inbound.type,
    );
    if (!eventId) {
      increment("whatsapp.duplicate");
      continue;
    }
    increment("whatsapp.received");
    // jobId = message id, so even a race between two deliveries queues it once.
    await enqueueInboundMessage({ eventId, ...inbound });
  }
  for (const status of parsed.statuses) {
    // Delivery/read receipts for Vera's own replies.
    await database()
      .update(message)
      .set({ deliveryStatus: status.status })
      .where(sql`${message.externalMessageId} = ${status.messageId}`);
  }
}

export function whatsappWebhookRouter() {
  const router = Router();

  // Meta's one-time verification handshake.
  router.get("/webhooks/whatsapp", (req, res) => {
    const config = env();
    if (
      config.WHATSAPP_ENABLED &&
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === config.WHATSAPP_VERIFY_TOKEN &&
      typeof req.query["hub.challenge"] === "string"
    ) {
      res.status(200).type("text/plain").send(req.query["hub.challenge"]);
      return;
    }
    res.sendStatus(403);
  });

  // The signature covers the exact bytes Meta sent, so the body is read raw.
  router.post(
    "/webhooks/whatsapp",
    express.raw({ type: "*/*", limit: "1mb" }),
    async (req, res) => {
      const config = env();
      if (!config.WHATSAPP_ENABLED) {
        res.sendStatus(404);
        return;
      }
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (
        !verifyMetaSignature(
          raw,
          req.get("x-hub-signature-256"),
          config.WHATSAPP_APP_SECRET!,
        )
      ) {
        increment("whatsapp.bad_signature");
        logger.warn("WhatsApp webhook signature rejected");
        res.sendStatus(401);
        return;
      }
      let body: unknown;
      try {
        body = JSON.parse(raw.toString("utf8"));
      } catch {
        res.sendStatus(400);
        return;
      }
      const parsed = parseWebhook(body);
      if (!parsed) {
        // Valid but irrelevant (another webhook field): acknowledge so Meta doesn't retry.
        res.sendStatus(200);
        return;
      }
      try {
        // Persist and enqueue, then acknowledge. The AI work happens in the worker.
        await handlePayload(parsed);
        res.sendStatus(200);
      } catch (error) {
        logger.error("Failed to accept WhatsApp webhook", { error });
        // A 5xx makes Meta redeliver; deduplication makes that safe.
        res.sendStatus(500);
      }
    },
  );

  return router;
}
