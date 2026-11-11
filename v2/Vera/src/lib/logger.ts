import { AsyncLocalStorage } from "node:async_hooks";

/** Fields every log line in a request or job carries. */
export type LogContext = {
  requestId?: string;
  correlationId?: string;
  channel?: "mcp" | "whatsapp" | "system";
  conversationId?: string;
  userId?: string;
  organisationId?: string;
};

const context = new AsyncLocalStorage<LogContext>();

export function withLogContext<T>(fields: LogContext, run: () => T): T {
  return context.run({ ...context.getStore(), ...fields }, run);
}

export function logContext(): LogContext {
  return context.getStore() ?? {};
}

// Secrets and personal data never reach the logs.
const REDACTED_KEYS =
  /authorization|cookie|token|secret|password|apikey|phone|^text$|^body$/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error)
    return { message: value.message, name: value.name };
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      REDACTED_KEYS.test(key) ? "[redacted]" : redact(entry, depth + 1),
    ]),
  );
}

type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function threshold(): number {
  if (process.env.NODE_ENV === "test" && !process.env.LOG_LEVEL) return 100;
  return order[(process.env.LOG_LEVEL as Level) ?? "info"] ?? order.info;
}

function write(
  level: Level,
  message: string,
  fields?: Record<string, unknown>,
) {
  if (order[level] < threshold()) return;
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    service: "vera",
    message,
    ...context.getStore(),
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  });
  (level === "error"
    ? console.error
    : level === "warn"
      ? console.warn
      : console.log)(line);
}

/** One JSON line per event, with the request/job context attached. */
export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) =>
    write("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) =>
    write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) =>
    write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) =>
    write("error", message, fields),
};
