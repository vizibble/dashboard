import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '@/service/JWTToken.js';
import type { AuthenticatedRequest } from '@/types/index.js';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Access denied' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Access denied' });
    return;
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  (req as AuthenticatedRequest).user = decoded;
  next();
}
