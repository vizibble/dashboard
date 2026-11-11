import { startEmailWorker } from "@/workers/email.worker";

const workers = [startEmailWorker()];
console.log("Email worker started");

async function shutdown() {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
