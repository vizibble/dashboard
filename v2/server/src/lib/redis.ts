import { Redis } from "ioredis";

import { env } from "@/lib/env";

// BullMQ requires maxRetriesPerRequest: null on worker connections
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export const redis = createRedisConnection();

// Fixed-window counter: increments the key and starts its expiry on the first hit
const consumeScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return { count, redis.call("TTL", KEYS[1]) }
`;

export async function consumeRateLimit(
  key: string,
  rule: { window: number; max: number },
): Promise<{ allowed: boolean; retryAfter: number | null }> {
  const [count, ttl] = (await redis.eval(
    consumeScript,
    1,
    `rate-limit:${key}`,
    rule.window,
  )) as [number, number];
  if (count <= rule.max) {
    return { allowed: true, retryAfter: null };
  }
  return { allowed: false, retryAfter: ttl > 0 ? ttl : rule.window };
}
