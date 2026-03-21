import jwt from 'jsonwebtoken';

import type { AuthJwtPayload } from '@/types/index.js';

const ACCESS_TOKEN_SECRET = () => {
  const s = process.env['ACCESS_TOKEN_SECRET'];
  if (!s) throw new Error('ACCESS_TOKEN_SECRET not set.');
  return s;
};

const REFRESH_TOKEN_SECRET = () => {
  const s = process.env['REFRESH_TOKEN_SECRET'];
  if (!s) throw new Error('REFRESH_TOKEN_SECRET not set.');
  return s;
};

export function generateAccessToken(payload: AuthJwtPayload): string {
  return jwt.sign({ user_id: payload.user_id }, ACCESS_TOKEN_SECRET(), {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(payload: AuthJwtPayload): string {
  return jwt.sign({ user_id: payload.user_id }, REFRESH_TOKEN_SECRET(), {
    expiresIn: '30d',
  });
}

/** Verifies an access token. Returns the decoded payload, or null if invalid. */
export function verifyAccessToken(token: string): AuthJwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET()) as AuthJwtPayload;
  } catch {
    return null;
  }
}

/** Verifies a refresh token. Returns the decoded payload, or null if invalid. */
export function verifyRefreshToken(token: string): AuthJwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET()) as AuthJwtPayload;
  } catch {
    return null;
  }
}
