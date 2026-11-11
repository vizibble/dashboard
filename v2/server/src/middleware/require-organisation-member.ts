import type { NextFunction, Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { textParam } from "@/lib/http";
import { findMembershipQuery } from "@/models/members";

declare global {
  namespace Express {
    interface Request {
      organisationId?: string;
      memberRole?: string;
    }
  }
}

/**
 * Confirms the signed-in user belongs to the organisation in the URL and records
 * their role for this request. Membership is read from the database on every request,
 * so a role change or removal takes effect immediately. The organisation id from the
 * URL is only trusted after this check.
 */
export async function requireOrganisationMember(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const membership = await findMembershipQuery(organisationId, req.userId);

  if (!membership) {
    throw new ApiError(403, "Organisation access denied");
  }
  req.organisationId = organisationId;
  req.memberRole = membership.role;
  next();
}
