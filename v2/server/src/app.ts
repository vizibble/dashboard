import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { errorHandler } from "@/middleware/error-handler";
import { analyticsRouter } from "@/routes/analytics.routes";
import { dashboardsRouter } from "@/routes/dashboards.routes";
import { devicesRouter } from "@/routes/devices.routes";
import { integrationsRouter } from "@/routes/integrations.routes";
import { locationsRouter } from "@/routes/locations.routes";
import { telemetryRouter } from "@/routes/telemetry.routes";
import { templatesRouter } from "@/routes/templates.routes";

export const app = express();

function oauthPathsForCors() {
  return [
    "/api/v2/auth/oauth2/token",
    "/api/v2/auth/oauth2/register",
    "/api/v2/auth/oauth2/revoke",
    "/api/v2/auth/jwks",
    "/.well-known",
    "/api/v2/auth/.well-known",
  ];
}

app.disable("x-powered-by");

// OAuth endpoints are called by AI platforms and browser-based MCP tools from any origin.
// Registered before the app-wide CORS so its preflight answer wins for these paths.
if (env.AI_INTEGRATIONS.enabled) {
  app.use(oauthPathsForCors(), cors({ origin: true, credentials: false }));
}

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// OAuth authorization server for AI clients (Vera). Unreachable until AI integrations are
// enabled, so this server can ship before Vera is deployed.
const oauthPaths = [
  "/api/v2/auth/oauth2",
  "/api/v2/auth/admin/oauth2",
  "/api/v2/auth/.well-known",
  "/.well-known/oauth-authorization-server",
  "/.well-known/openid-configuration",
];
if (env.AI_INTEGRATIONS.enabled) {
  // RFC 8414 puts metadata for an issuer with a path at the root, suffixed by that path.
  app.get(
    "/.well-known/oauth-authorization-server/api/v2/auth",
    toNodeHandler(oauthProviderAuthServerMetadata(auth)),
  );
  app.get(
    "/.well-known/openid-configuration/api/v2/auth",
    toNodeHandler(oauthProviderOpenIdConfigMetadata(auth)),
  );
} else {
  app.use(oauthPaths, (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

// Better Auth
app.all("/api/v2/auth/*splat", toNodeHandler(auth));

// API routes
app.use(
  "/api/v2",
  express.json({ limit: "256kb" }),
  locationsRouter,
  templatesRouter,
  devicesRouter,
  dashboardsRouter,
  analyticsRouter,
  telemetryRouter,
  integrationsRouter,
);

// Not found
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling
app.use(errorHandler);
