import { Queue } from "bullmq";

import type { EmailJob } from "@/lib/email-templates";
import { createRedisConnection } from "@/lib/redis";

export const EMAIL_QUEUE_NAME = "email";

export const emailQueue = new Queue<EmailJob>(EMAIL_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5_000 },
    // Jobs carry one-time links, so they are not kept after delivery
    removeOnComplete: true,
    removeOnFail: { age: 24 * 60 * 60 },
  },
});

export async function enqueueEmail(job: EmailJob): Promise<void> {
  await emailQueue.add(job.type, job);
}
