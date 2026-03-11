import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

import { getUserByEmail } from '@/models/auth.js';
import { expectError } from '@/utils/expectError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwtToken.js';
import { getTimestamp } from '@/utils/time.js';

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface LoginBody {
  email: string;
  password: string;
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Partial<LoginBody>;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const [dbErr, user] = await expectError(getUserByEmail(email));
  if (dbErr) {
    console.error(`[${getTimestamp()}] Login DB error:`, dbErr);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload = { user_id: user.user_id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const isProduction = process.env['NODE_ENV'] === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });

  res.status(200).json({ accessToken });
}

export function handleRefresh(req: Request, res: Response): void {
  const refreshToken = (req as { cookies?: Record<string, string> }).cookies?.[
    'refreshToken'
  ];
  if (!refreshToken) {
    res.status(401).json({ error: 'Please Login Again' });
    return;
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    res.status(401).json({ error: 'Please Login Again' });
    return;
  }

  const accessToken = generateAccessToken({ user_id: decoded.user_id });
  res.status(200).json({ accessToken });
}

export function handleLogout(_req: Request, res: Response): void {
  const isProduction = process.env['NODE_ENV'] === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.status(200).json({ success: true });
}
