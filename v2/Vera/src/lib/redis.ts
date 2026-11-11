import { Redis } from "ioredis";

import { env } from "@/config/env";

// Same setup as the main server: BullMQ requires maxRetriesPerRequest: null.
export function createRedisConnection(): Redis {
  return new Redis(env().REDIS_URL, { maxRetriesPerRequest: null });
}
