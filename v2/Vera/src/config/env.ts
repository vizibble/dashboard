import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4100),

    /** Public origin of this service, e.g. https://ai.vizibble.in */
    VERA_PUBLIC_URL: z.url(),
    VERA_DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    /** 32 random bytes, base64 (openssl rand -base64 32). Encrypts stored grant tokens. */
    VERA_ENCRYPTION_KEY: z
      .string()
      .refine((v) => Buffer.from(v, "base64").length === 32, {
        message: "must be 32 random bytes, base64-encoded",
      }),

    // Main Vizibble app
    VIZIBBLE_API_URL: z.url(),
    VIZIBBLE_SERVICE_TOKEN: z.string().min(32),
    /** Better Auth base URL + base path, e.g. https://app.vizibble.in/api/v2/auth */
    VIZIBBLE_OAUTH_ISSUER: z.url(),

    // OpenAI (WhatsApp conversations only; ChatGPT/Claude bring their own model)
    OPENAI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default("gpt-5.5"),

    // WhatsApp Cloud API
    WHATSAPP_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    WHATSAPP_APP_SECRET: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_GRAPH_URL: z.url().default("https://graph.facebook.com/v23.0"),

    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(4),
  })
  .superRefine((value, ctx) => {
    if (!value.WHATSAPP_ENABLED) return;
    for (const key of [
      "WHATSAPP_VERIFY_TOKEN",
      "WHATSAPP_APP_SECRET",
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "OPENAI_API_KEY",
    ] as const) {
      if (!value[key])
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required when WHATSAPP_ENABLED=true",
        });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const problems = result.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid Vera configuration:\n${problems}`);
    }
    cached = result.data;
  }
  return cached;
}

/** URLs derived from the configuration. */
export function urls() {
  const config = env();
  const publicUrl = config.VERA_PUBLIC_URL.replace(/\/+$/, "");
  const issuer = config.VIZIBBLE_OAUTH_ISSUER.replace(/\/+$/, "");
  return {
    mcpUrl: `${publicUrl}/mcp`,
    resourceMetadataUrl: `${publicUrl}/.well-known/oauth-protected-resource/mcp`,
    issuer,
    jwksUrl: `${issuer}/jwks`,
    apiBase: `${config.VIZIBBLE_API_URL.replace(/\/+$/, "")}/api/v2`,
  };
}
