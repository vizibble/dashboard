import type { NextFunction, Request, Response } from 'express';

import { getUserSettings, updateUserSettings } from '@/models/user.js';
import type { AuthenticatedRequest } from '@/types/index.js';
import { APIError } from '@/utils/apiError.js';
import { expectError } from '@/utils/expectError.js';
import { ApiResponse } from '@/utils/apiResponse.js';

export async function handleGetSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;

    const [err, settings] = await expectError(getUserSettings(userId));
    if (err) {
      next(new APIError('Failed to fetch settings.', 500));
      return;
    }

    ApiResponse.success(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const settings = req.body;

    const [err] = await expectError(updateUserSettings(userId, settings));
    if (err) {
      next(new APIError('Failed to update settings.', 500));
      return;
    }

    ApiResponse.success(res, null, 200, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
}
