import { Queue, Worker } from 'bullmq';

import redisConnection from '@/service/redisConnection.js';
// Define the shape of the data that will be in the queue jobs
import type { EmailJobData } from '@/types/index.js';
import { sendAlertEmail } from '@/utils/alertEmail.js';

const QUEUE_NAME = 'email-queue';

// Create the Queue
export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection as any,
});

// Create the Worker logic
export let emailWorker: Worker | null = null;

export function spawnEmailWorker() {
  if (emailWorker) return;

  emailWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const data = job.data as EmailJobData;
      console.log(`[Worker] Sending email to ${data.to} (Job ID: ${job.id})`);

      await sendAlertEmail({
        ...data,
        firedAt: new Date(data.firedAt),
      });
    },
    { connection: redisConnection as any }
  );

  emailWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
}

export async function shutdownEmailWorker() {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('Worker shutdown complete');
  }
}
