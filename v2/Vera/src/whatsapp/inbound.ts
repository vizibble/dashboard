import type { Redis } from "ioredis";
import OpenAI from "openai";
import { eq, sql } from "drizzle-orm";

import {
  resumeAgent,
  runAgent,
  type AgentOutcome,
  type AgentTurn,
} from "@/agent/agent";
import { checkInput, checkRateLimit } from "@/agent/guardrails";
import { env } from "@/config/env";
import { database } from "@/db/client";
import { webhookEvent } from "@/db/schema";
import { hashIdentifier } from "@/lib/crypto";
import { logger, withLogContext } from "@/lib/logger";
import { increment } from "@/lib/stats";
import type { InboundMessageJob } from "@/queues/whatsapp.queue";
import type { ToolContext } from "@/tools/types";
import {
  vizibble,
  VizibbleApiError,
  type VizibbleClient,
} from "@/vizibble/client";
import { sendText, WhatsappSendError } from "@/whatsapp/cloud-api";
import {
  findLinkedIdentity,
  openConversation,
  revokeIdentity,
  saveAssistantMessage,
  saveLinkedIdentity,
  savePendingApproval,
  saveUserMessage,
  takePendingApproval,
  updateIdentityActivity,
} from "@/whatsapp/identities";

export type InboundDeps = {
  api: VizibbleClient;
  redis: Redis;
  send: (to: string, text: string) => Promise<string>;
  agent: (
    history: AgentTurn[],
    message: string,
    context: ToolContext,
  ) => Promise<AgentOutcome>;
  resume: (
    state: string,
    approved: boolean,
    context: ToolContext,
  ) => Promise<AgentOutcome>;
};

export const defaultDeps = (redis: Redis): InboundDeps => ({
  api: vizibble,
  redis,
  send: sendText,
  agent: runAgent,
  resume: resumeAgent,
});

const LINK_COMMAND = /^link\s+([a-z0-9-]{4,40})$/i;
const UNLINK_COMMAND = /^(unlink|disconnect)$/i;
const APPROVE = /^(yes|y|confirm|approve)[.!]?$/i;
const DECLINE = /^(no|n|cancel)[.!]?$/i;

const NOT_LINKED =
  "Hi, I'm *Vera*, Vizibble's assistant. This number isn't linked to a Vizibble account yet.\n\nIn Vizibble, open *Integrations → WhatsApp → Connect*, then send me the code shown there (it looks like *LINK ABCD-1234*).";
const RELINK =
  "Your WhatsApp is no longer connected to Vizibble. To reconnect, open *Integrations → WhatsApp → Connect* in Vizibble.";
const UNAVAILABLE =
  "Sorry, I can't answer right now. Please try again in a few minutes.";

async function setEventStatus(
  eventId: string,
  status: "processed" | "ignored" | "failed",
  error?: string,
) {
  await database()
    .update(webhookEvent)
    .set({
      status,
      processedAt: sql`now()`,
      lastError: error?.slice(0, 500) ?? null,
      attempts: sql`${webhookEvent.attempts} + 1`,
    })
    .where(eq(webhookEvent.id, eventId));
}

async function alreadyHandled(eventId: string) {
  const [row] = await database()
    .select({ status: webhookEvent.status })
    .from(webhookEvent)
    .where(eq(webhookEvent.id, eventId));
  return row?.status === "processed" || row?.status === "ignored";
}

/**
 * Handles one inbound WhatsApp message end to end. Throws only for failures worth retrying
 * (WhatsApp or AI provider temporarily unavailable); BullMQ retries with backoff.
 */
export async function handleInboundMessage(
  job: InboundMessageJob,
  deps: InboundDeps,
  isFinalAttempt: boolean,
): Promise<void> {
  if (await alreadyHandled(job.eventId)) return;

  // Per number, before anything is sent: stops code guessing and reply spam from any
  // number, linked or not. Over-limit messages are dropped without a (billable) reply.
  if (
    await checkRateLimit(
      deps.redis,
      `phone:${hashIdentifier(job.from, env().VERA_ENCRYPTION_KEY)}`,
    )
  ) {
    increment("whatsapp.throttled");
    await setEventStatus(job.eventId, "ignored", "rate limited");
    return;
  }

  const reply = async (text: string) => {
    await deps.send(job.from, text);
    increment("whatsapp.replied");
  };

  // Non-text messages (images, voice, stickers…) get a short explanation.
  if (job.type !== "text") {
    await reply(
      "I can only read text messages for now. Please type your question.",
    );
    await setEventStatus(job.eventId, "ignored");
    return;
  }

  const text = job.text?.trim() ?? "";
  const linkMatch = LINK_COMMAND.exec(text);
  if (linkMatch) {
    await linkAccount(job, linkMatch[1]!, deps, reply);
    return;
  }

  const identity = await findLinkedIdentity(job.from);
  if (!identity) {
    // A phone number never grants access on its own.
    await reply(NOT_LINKED);
    await setEventStatus(job.eventId, "ignored");
    return;
  }
  const delegation = {
    kind: "grant" as const,
    grantToken: identity.grantToken,
  };

  await withLogContext(
    {
      channel: "whatsapp",
      userId: identity.userId,
      correlationId: job.messageId,
    },
    async () => {
      if (UNLINK_COMMAND.test(text)) {
        await deps.api
          .revokeGrant(delegation)
          .catch((error) => logger.warn("Grant revoke failed", { error }));
        await revokeIdentity(identity.id);
        await reply("Done. This number is no longer connected to Vizibble.");
        await setEventStatus(job.eventId, "processed");
        return;
      }

      const input = checkInput(text);
      const limited = input.ok
        ? await checkRateLimit(deps.redis, identity.userId)
        : null;
      if (!input.ok || limited) {
        await reply(input.ok ? limited! : input.reply);
        await setEventStatus(job.eventId, "ignored");
        return;
      }

      // Confirms the grant is still live (unlinked in the dashboard, user removed…).
      try {
        await deps.api.me(delegation);
      } catch (error) {
        if (
          error instanceof VizibbleApiError &&
          error.code === "delegation_revoked"
        ) {
          await revokeIdentity(identity.id);
          await reply(RELINK);
          await setEventStatus(job.eventId, "processed");
          return;
        }
        throw error;
      }

      const { conversationId, history } = await openConversation(identity);
      const context: ToolContext = {
        channel: "whatsapp",
        userId: identity.userId,
        delegation,
        api: deps.api,
        conversationId,
        requestId: job.messageId,
        activeOrganisationId: identity.activeOrganisationId,
        defaultOrganisationId: identity.defaultOrganisationId,
      };

      // A proposed change is waiting: YES runs it, NO declines it, anything else cancels it.
      const pending = await takePendingApproval(conversationId);
      const decision = pending
        ? APPROVE.test(input.text)
          ? true
          : DECLINE.test(input.text)
            ? false
            : null
        : null;

      let result: AgentOutcome;
      try {
        result = await withLogContext({ conversationId }, () =>
          pending && decision !== null
            ? deps.resume(pending.state, decision, context)
            : deps.agent(
                history,
                pending
                  ? `(The earlier proposed change was cancelled.) ${input.text}`
                  : input.text,
                context,
              ),
        );
      } catch (error) {
        if (isRetryable(error) && !isFinalAttempt) throw error;
        logger.error("Assistant failed", { error });
        await reply(UNAVAILABLE);
        await setEventStatus(job.eventId, "failed", (error as Error).message);
        return;
      }

      let outgoing: string;
      if (result.kind === "approval") {
        await savePendingApproval(conversationId, result.summary, result.state);
        outgoing = `I'm ready to:\n${result.summary}\n\nReply *YES* to go ahead or *NO* to cancel. This expires in 10 minutes.`;
      } else {
        outgoing = result.reply;
      }

      const sentId = await deps.send(job.from, outgoing);
      increment("whatsapp.replied");
      await setEventStatus(job.eventId, "processed");
      await saveUserMessage(conversationId, input.text, job.messageId);
      await saveAssistantMessage(conversationId, {
        content: outgoing,
        externalMessageId: sentId,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        organisationId: context.activeOrganisationId ?? null,
      });
      await updateIdentityActivity(
        identity.id,
        context.activeOrganisationId ?? null,
      );
    },
  );
}

async function linkAccount(
  job: InboundMessageJob,
  code: string,
  deps: InboundDeps,
  reply: (text: string) => Promise<void>,
) {
  try {
    const grant = await deps.api.completeWhatsappLink(code, job.from);
    await saveLinkedIdentity(job.from, {
      grantId: grant.grant_id,
      grantToken: grant.grant_token,
      userId: grant.user_id,
      defaultOrganisationId: grant.default_organisation_id,
    });
    const me = await deps.api.me({
      kind: "grant",
      grantToken: grant.grant_token,
    });
    const organisation = me.organisations.find(
      (o) => o.id === grant.default_organisation_id,
    );
    await reply(
      `You're connected, ${me.user.name.split(" ")[0]}! I'm *Vera*, Vizibble's assistant.` +
        (organisation ? ` I'll answer about *${organisation.name}*.` : "") +
        `\n\nTry: _What is the current temperature of Line 6?_ or _Which devices are offline?_\nSend *UNLINK* any time to disconnect.`,
    );
    await setEventStatus(job.eventId, "processed");
  } catch (error) {
    if (error instanceof VizibbleApiError && error.code === "invalid_request") {
      await reply(
        "That code is invalid or has expired. Generate a new one in Vizibble under *Integrations → WhatsApp*.",
      );
      await setEventStatus(job.eventId, "processed");
      return;
    }
    throw error;
  }
}

function isRetryable(error: unknown) {
  if (error instanceof WhatsappSendError) return error.retryable;
  if (error instanceof OpenAI.APIConnectionError) return true;
  if (error instanceof OpenAI.APIError)
    return error.status === 429 || (error.status ?? 0) >= 500;
  return error instanceof VizibbleApiError && error.code === "unavailable";
}
