import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { AI_READ_SCOPE, AI_WRITE_SCOPE } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  findClientConsentQuery,
  findLiveGrantByTokenHashQuery,
  findVerifiedUserQuery,
  touchGrantQuery,
} from "@/models/integrations";

declare global {
  namespace Express {
    interface Request {
      /** Set when the request was made by Vera on behalf of a user. */
      integration?: {
        kind: "mcp" | "grant";
        /** Whether this delegation may change data (subject to the role's permissions). */
        canWrite: boolean;
        clientId?: string;
        grantId?: string;
        defaultOrganisationId: string | null;
      };
    }
  }
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sameSecret(given: string, expected: string) {
  // Hashing first gives equal-length buffers, so the comparison is constant-time.
  return timingSafeEqual(
    Buffer.from(sha256(given)),
    Buffer.from(sha256(expected)),
  );
}

/**
 * Accepts only Vera's service credential. On its own it grants no data access: organisation
 * routes also require `requireIntegrationUser`. Unknown when AI integrations are disabled.
 */
export function requireIntegrationService(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const config = env.AI_INTEGRATIONS;
  if (!config.enabled) {
    throw new ApiError(404, "Not found");
  }
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !sameSecret(token, config.serviceToken)) {
    throw new ApiError(401, "Invalid service credential");
  }
  next();
}

/**
 * Resolves the user Vera is acting for from a delegation the main server issued and can
 * revoke: an active OAuth consent (ChatGPT/Claude via MCP) or a live WhatsApp grant.
 * Sets `req.userId`, so the dashboard's own membership and permission guards apply next.
 * Mount after `requireIntegrationService`.
 */
export async function requireIntegrationUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const kind = req.get("x-vizibble-delegation");

  if (kind === "mcp") {
    const userId = req.get("x-vizibble-user");
    const clientId = req.get("x-vizibble-client");
    if (!userId || !clientId) {
      throw new ApiError(401, "Delegation headers are incomplete");
    }
    const consent = await findClientConsentQuery(
      userId,
      clientId,
      AI_READ_SCOPE,
    );
    if (!consent) {
      throw new ApiError(401, "The AI connection has been revoked");
    }
    req.integration = {
      kind,
      clientId,
      canWrite: consent.scopes.includes(AI_WRITE_SCOPE),
      defaultOrganisationId: null,
    };
    req.userId = await verifiedUserId(userId);
    return next();
  }

  if (kind === "grant") {
    const token = req.get("x-vizibble-grant");
    if (!token || token.length > 200) {
      throw new ApiError(401, "Delegation headers are incomplete");
    }
    const grant = await findLiveGrantByTokenHashQuery(sha256(token));
    if (!grant) {
      throw new ApiError(401, "The linked account has been disconnected");
    }
    req.integration = {
      kind,
      // Linked WhatsApp users confirm every change in the chat before Vera sends it.
      canWrite: true,
      grantId: grant.id,
      defaultOrganisationId: grant.organizationId,
    };
    req.userId = await verifiedUserId(grant.userId);
    void touchGrantQuery(grant.id).catch((error) =>
      console.error("Failed to record grant use", error),
    );
    return next();
  }

  throw new ApiError(401, "A user delegation is required");
}

async function verifiedUserId(userId: string) {
  const found = await findVerifiedUserQuery(userId);
  if (!found) {
    throw new ApiError(401, "The user account is not available");
  }
  return found.id;
}

/**
 * Changes need a delegation that allows writing: for ChatGPT/Claude, a consent that
 * includes vizibble:write. The role's own permissions are still checked afterwards.
 */
export function requireIntegrationWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.integration?.canWrite) {
    throw new ApiError(
      403,
      "This connection is read-only. Reconnect it and allow changes to edit data.",
    );
  }
  next();
}
