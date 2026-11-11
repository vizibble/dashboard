import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import {
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server";

import { urls } from "@/config/env";

export const REQUIRED_SCOPE = "vizibble:read";
/** Optional: lets the connection use create/update/delete tools (still limited by role). */
export const WRITE_SCOPE = "vizibble:write";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/**
 * Verifies OAuth access tokens issued by the main app's Better Auth OAuth provider:
 * signature (JWKS), issuer, audience = this MCP endpoint, access-token type and expiry.
 * Revocation and permission changes are enforced by the main API on every tool call.
 */
export const tokenVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const { issuer, jwksUrl, mcpUrl } = urls();
    jwks ??= createRemoteJWKSet(new URL(jwksUrl));
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: mcpUrl,
        // Rejects a user's session JWT signed with the same key.
        typ: "at+jwt",
        requiredClaims: ["sub", "azp", "exp"],
      });
      const scopes =
        typeof payload.scope === "string" ? payload.scope.split(" ") : [];
      return {
        token,
        clientId: String(payload.azp),
        scopes,
        expiresAt: payload.exp,
        resource: new URL(mcpUrl),
        extra: { userId: payload.sub },
      };
    } catch (error) {
      const message =
        error instanceof errors.JWTExpired
          ? "Access token expired"
          : "Invalid access token";
      throw new OAuthError(OAuthErrorCode.InvalidToken, message);
    }
  },
};
