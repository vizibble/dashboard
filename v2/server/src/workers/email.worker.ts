import { Worker } from "bullmq";

import { deliverEmail } from "@/lib/email";
import type { EmailJob } from "@/lib/email-templates";
import { createRedisConnection } from "@/lib/redis";
import { EMAIL_QUEUE_NAME } from "@/queues/email.queue";

export function startEmailWorker(): Worker<EmailJob> {
  const worker = new Worker<EmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      await deliverEmail(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
      limiter: { max: 10, duration: 1_000 },
    },
  );

  // Log job ids and types only; payloads contain addresses and tokens
  worker.on("completed", (job) => {
    console.log(`[email] sent ${job.name} (${job.id})`);
  });
  worker.on("failed", (job, error) => {
    console.error(
      `[email] ${job?.name} (${job?.id}) failed on attempt ${job?.attemptsMade}: ${error.message}`,
    );
  });

  return worker;
}
