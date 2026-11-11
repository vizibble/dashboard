function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getPort(key: string): number {
  const port = Number(getEnv(key));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${key} must be a valid port number`);
  }
  return port;
}

function getBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return defaultValue;
  }
  if (value !== "true" && value !== "false") {
    throw new Error(`${key} must be "true" or "false"`);
  }
  return value === "true";
}

function getOptional(key: string): string | undefined {
  const value = process.env[key];
  return value ? value : undefined;
}

/**
 * AI integrations (Vera) are off unless explicitly enabled, so this server can be deployed
 * before Vera exists. When enabled, Vera's public MCP URL and its service token are required.
 */
function getAiIntegrations() {
  const enabled = getBoolean("AI_INTEGRATIONS_ENABLED", false);
  if (!enabled) {
    return {
      enabled: false as const,
      mcpUrl: null,
      serviceToken: null,
      whatsappNumber: null,
    };
  }
  const mcpUrl = getEnv("VERA_MCP_URL");
  if (!URL.canParse(mcpUrl)) {
    throw new Error("VERA_MCP_URL must be an absolute URL");
  }
  const serviceToken = getEnv("VERA_SERVICE_TOKEN");
  if (serviceToken.length < 32) {
    throw new Error("VERA_SERVICE_TOKEN must be at least 32 characters");
  }
  return {
    enabled: true as const,
    mcpUrl,
    serviceToken,
    // Shown to users while linking WhatsApp. WhatsApp linking is unavailable without it.
    whatsappNumber: getOptional("VERA_WHATSAPP_NUMBER") ?? null,
  };
}

// Application configuration
export const env = {
  PORT: getPort("PORT"),

  // Client
  FRONTEND_URL: getEnv("FRONTEND_URL"),

  // Database
  DATABASE_URL: getEnv("DATABASE_URL"),

  // Authentication
  BETTER_AUTH_URL: getEnv("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: getEnv("BETTER_AUTH_SECRET"),

  // Redis
  REDIS_URL: getEnv("REDIS_URL"),

  // Email
  SMTP_HOST: getEnv("SMTP_HOST"),
  SMTP_PORT: getPort("SMTP_PORT"),
  SMTP_SECURE: getBoolean("SMTP_SECURE", process.env.SMTP_PORT === "465"),
  SMTP_USER: getEnv("SMTP_USER"),
  SMTP_PASSWORD: getEnv("SMTP_PASSWORD"),
  SMTP_FROM: getEnv("SMTP_FROM"),

  // AI integrations (Vera)
  AI_INTEGRATIONS: getAiIntegrations(),
} as const;
