import { closeDatabase } from "@/db/client";
import { logger } from "@/lib/logger";
import { startWhatsappWorker } from "@/workers/whatsapp.worker";

const workers = [startWhatsappWorker()];
logger.info("WhatsApp worker started");

async function shutdown() {
  // Lets in-flight messages finish; unfinished ones are retried by another worker.
  await Promise.all(workers.map((worker) => worker.close()));
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
