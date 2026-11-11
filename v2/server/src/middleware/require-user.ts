import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    throw new ApiError(401, "Authentication required");
  }
  if (!session.user.emailVerified) {
    throw new ApiError(403, "Email verification required");
  }
  req.userId = session.user.id;
  next();
}
