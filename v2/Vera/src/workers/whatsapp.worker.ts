import { Worker } from "bullmq";

import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { createRedisConnection } from "@/lib/redis";
import {
  WHATSAPP_QUEUE_NAME,
  type InboundMessageJob,
} from "@/queues/whatsapp.queue";
import { defaultDeps, handleInboundMessage } from "@/whatsapp/inbound";

export function startWhatsappWorker(): Worker<InboundMessageJob> {
  const deps = defaultDeps(createRedisConnection());
  const worker = new Worker<InboundMessageJob>(
    WHATSAPP_QUEUE_NAME,
    async (job) => {
      const attempts = job.opts.attempts ?? 1;
      await handleInboundMessage(
        job.data,
        deps,
        job.attemptsMade + 1 >= attempts,
      );
    },
    {
      connection: createRedisConnection(),
      concurrency: env().WORKER_CONCURRENCY,
      // A stuck job is retried after this long rather than blocking forever.
      lockDuration: 120_000,
    },
  );

  // Log ids only; payloads contain phone numbers and message text.
  worker.on("completed", (job) =>
    logger.info("WhatsApp message handled", { jobId: job.id }),
  );
  worker.on("failed", (job, error) =>
    logger.error("WhatsApp message failed", {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    }),
  );
  return worker;
}
