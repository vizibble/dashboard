import { env } from "@/config/env";
import { closeDatabase } from "@/db/client";
import { createApp } from "@/http/app";
import { logger } from "@/lib/logger";
import { whatsappQueue } from "@/queues/whatsapp.queue";

const { PORT } = env();
const server = createApp().listen(PORT, () => {
  logger.info(`Vera listening on http://localhost:${PORT}`);
});

async function shutdown() {
  logger.info("Shutting down");
  server.close();
  await whatsappQueue().close();
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
