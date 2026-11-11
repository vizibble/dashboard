import express, { type ErrorRequestHandler } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { env, urls } from "@/config/env";
import { pingDatabase } from "@/db/client";
import { logger, withLogContext } from "@/lib/logger";
import { snapshot } from "@/lib/stats";
import { mcpRouter } from "@/mcp/router";
import { whatsappQueue } from "@/queues/whatsapp.queue";
import { circuitState } from "@/vizibble/client";
import { whatsappWebhookRouter } from "@/whatsapp/webhook";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Request and correlation ids on every log line and every call to the main API.
  app.use((req, res, next) => {
    const requestId = req.get("x-request-id") ?? crypto.randomUUID();
    res.setHeader("x-request-id", requestId);
    withLogContext(
      {
        requestId,
        correlationId: req.get("x-correlation-id") ?? requestId,
        channel: "system",
      },
      next,
    );
  });

  // WhatsApp needs the raw body for its signature, so it's mounted before the JSON parser.
  app.use(whatsappWebhookRouter());

  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/mcp",
    // Per-user once authenticated, per-IP before that.
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      keyGenerator: (req) =>
        req.get("authorization")?.slice(-32) ?? ipKeyGenerator(req.ip ?? ""),
    }),
  );
  app.use(mcpRouter());

  app.get("/health", async (_req, res) => {
    const checks = await healthChecks();
    const healthy = checks.database === "ok" && checks.queue === "ok";
    res
      .status(healthy ? 200 : 503)
      .json({ status: healthy ? "ok" : "degraded", checks, stats: snapshot() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    logger.error("Unhandled request error", { error });
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);
  return app;
}

/** Database, queue (with depth and dead letters) and main-API reachability. */
async function healthChecks() {
  const result: Record<string, unknown> = { main_api_circuit: circuitState() };
  try {
    await pingDatabase();
    result.database = "ok";
  } catch {
    result.database = "unreachable";
  }
  try {
    const counts = await whatsappQueue().getJobCounts(
      "waiting",
      "active",
      "delayed",
      "failed",
    );
    result.queue = "ok";
    result.queue_counts = counts;
  } catch {
    result.queue = "unreachable";
  }
  try {
    const response = await fetch(`${urls().jwksUrl}`, {
      signal: AbortSignal.timeout(3000),
    });
    result.main_api = response.ok ? "ok" : `status ${response.status}`;
  } catch {
    result.main_api = "unreachable";
  }
  result.whatsapp = env().WHATSAPP_ENABLED ? "enabled" : "disabled";
  return result;
}
