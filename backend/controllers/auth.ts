import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';

import { getUserByEmail } from '@/models/auth.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/service/JWTToken.js';
import type { LoginBody } from '@/types/index.js';
import { APIError } from '@/utils/apiError.js';
import { ErrorCodes } from '@/utils/errorCodes.js';
import { expectError } from '@/utils/expectError.js';
import { ApiResponse } from '@/utils/apiResponse.js';

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function handleLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as Partial<LoginBody>;
    if (!email || !password) {
      ApiResponse.fail(res, ErrorCodes.MISSING_CREDENTIALS, 400);
      return;
    }

    const [dbErr, user] = await expectError(getUserByEmail(email));
    if (dbErr) {
      next(new APIError('Database error occurred', 500));
      return;
    }
    if (!user) {
      ApiResponse.fail(res, ErrorCodes.INVALID_CREDENTIALS, 401);
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      ApiResponse.fail(res, ErrorCodes.INVALID_CREDENTIALS, 401);
      return;
    }

    const payload = { user_id: user.user_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });

    ApiResponse.success(res, { accessToken });
  } catch (error) {
    next(error);
  }
}

export function handleRefresh(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const refreshToken = (req as { cookies?: Record<string, string> })
      .cookies?.['refreshToken'];
    if (!refreshToken) {
      ApiResponse.fail(res, ErrorCodes.TOKEN_EXPIRED, 401);
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      ApiResponse.fail(res, ErrorCodes.TOKEN_EXPIRED, 401);
      return;
    }

    const accessToken = generateAccessToken({ user_id: decoded.user_id });
    ApiResponse.success(res, { accessToken });
  } catch (error) {
    next(error);
  }
}

export function handleLogout(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    ApiResponse.success(res, { success: true });
  } catch (error) {
    next(error);
  }
}
