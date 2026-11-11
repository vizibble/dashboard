import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { jwt, organization } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";

import { db } from "@/db/client";
import { databaseSchema } from "@/db/schema";
import {
  sendExistingAccountEmail,
  sendInvitationEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/redis";
import { ac, roles } from "@vizibble/shared/permissions";

const ONE_HOUR = 60 * 60;

/** Scopes an AI client may hold through Vera. Changing data is a separate, explicit consent. */
export const AI_READ_SCOPE = "vizibble:read";
export const AI_WRITE_SCOPE = "vizibble:write";
export const OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  AI_READ_SCOPE,
  AI_WRITE_SCOPE,
];

// Vera's MCP endpoint is the only protected resource access tokens are issued for.
const aiResources = env.AI_INTEGRATIONS.enabled
  ? [
      {
        identifier: env.AI_INTEGRATIONS.mcpUrl,
        name: "Vizibble AI",
        // Short-lived because JWT access tokens can't be revoked early. Disconnecting is
        // still immediate: the integration API re-checks the consent on every call.
        accessTokenTtl: 15 * 60,
        allowedScopes: OAUTH_SCOPES,
      },
    ]
  : [];

// Authentication
export const auth = betterAuth({
  appName: "Vizibble",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v2/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],

  // Database
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: databaseSchema,
  }),

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: sendResetPasswordEmail,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: sendPasswordChangedEmail,
    onExistingUserSignUp: sendExistingAccountEmail,
  },

  // Email verification
  emailVerification: {
    sendVerificationEmail,
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR,
  },

  // Rate limiting (Redis-backed so limits hold across instances)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customStorage: { consume: consumeRateLimit },
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 15 * 60, max: 3 },
      "/reset-password": { window: 15 * 60, max: 5 },
      "/send-verification-email": { window: 15 * 60, max: 3 },
      "/verify-email": { window: 60, max: 10 },
    },
  },

  // The JWT plugin's own /token route issues session JWTs; only OAuth access tokens are wanted.
  disabledPaths: ["/token"],

  plugins: [
    // Signing keys and JWKS for OAuth access tokens (verified by Vera).
    jwt({ disableSettingJwtHeader: true }),
    // OAuth 2.1 authorization server for AI clients (ChatGPT, Claude) connecting to Vera.
    // Its routes are unreachable unless AI integrations are enabled (see app.ts).
    oauthProvider({
      loginPage: `${env.FRONTEND_URL}/login`,
      consentPage: `${env.FRONTEND_URL}/oauth/consent`,
      scopes: OAUTH_SCOPES,
      resources: aiResources,
      clientRegistrationDefaultResources: aiResources.map((r) => r.identifier),
      // ChatGPT and Claude register themselves (RFC 7591) before the user signs in.
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultScopes: OAUTH_SCOPES,
      // Native MCP clients (e.g. Claude Code) omit application_type and use loopback callbacks.
      clientRegistrationDefaultApplicationType: "infer",
      // Clients arrive only through dynamic registration; users and sessions can never
      // create, edit or list OAuth clients or resources directly.
      clientPrivileges: () => false,
      resourcePrivileges: () => false,
      accessTokenExpiresIn: 15 * 60,
      refreshTokenExpiresIn: 30 * 24 * ONE_HOUR,
    }),
    // Organisation management
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      // Shared with the client plugin; see shared/permissions.ts.
      ac,
      roles,
      cancelPendingInvitationsOnReInvite: true,
      sendInvitationEmail,
    }),
  ],
});
