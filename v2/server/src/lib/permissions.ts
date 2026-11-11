import type { NextFunction, Request, Response } from "express";
import {
  roleHasPermission,
  type Permissions,
} from "@vizibble/shared/permissions";

import { ApiError } from "@/lib/api-error";

/**
 * Whether the current member holds every listed permission. Uses the same Better Auth
 * role definitions as the organisation plugin, against the role that
 * requireOrganisationMember just read from the database.
 */
export function can(req: Request, permissions: Permissions) {
  return roleHasPermission(req.memberRole, permissions);
}

export function assertCan(req: Request, permissions: Permissions) {
  if (!req.memberRole) {
    throw new ApiError(401, "Authentication required");
  }
  if (!can(req, permissions)) {
    throw new ApiError(403, "You don't have permission to do this");
  }
}

/** Route guard. Mount after requireUser and requireOrganisationMember. */
export function requirePermission(permissions: Permissions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    assertCan(req, permissions);
    next();
  };
}
