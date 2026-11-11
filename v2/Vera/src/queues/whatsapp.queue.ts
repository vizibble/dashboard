import { Queue } from "bullmq";

import { createRedisConnection } from "@/lib/redis";

export const WHATSAPP_QUEUE_NAME = "whatsapp-inbound";

/** One inbound WhatsApp message, already persisted as a webhook event. */
export type InboundMessageJob = {
  eventId: string;
  messageId: string;
  from: string;
  type: string;
  text: string | null;
  receivedAt: string;
};

let queue: Queue<InboundMessageJob> | undefined;

export function whatsappQueue() {
  queue ??= new Queue<InboundMessageJob>(WHATSAPP_QUEUE_NAME, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: "exponential", delay: 3_000 },
      removeOnComplete: { age: 24 * 60 * 60 },
      // Failed jobs stay for a week as the dead-letter list (see /health).
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  });
  return queue;
}

/** The job id is Meta's message id, so a redelivered webhook can't queue the message twice. */
export async function enqueueInboundMessage(
  job: InboundMessageJob,
): Promise<void> {
  await whatsappQueue().add("message", job, { jobId: job.messageId });
}
