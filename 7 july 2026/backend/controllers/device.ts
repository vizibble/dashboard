import type { NextFunction, Request, Response } from 'express';

import { hasDevicePermission } from '@/models/auth.js';
import {
  getAvailableDates,
  getDeviceHistory,
  getDeviceParameters,
  getDeviceRecordsByDate,
  getUserDevices,
} from '@/models/device.js';
import { getUserSettings } from '@/models/user.js';
import type { AuthenticatedRequest } from '@/types/index.js';
import { APIError } from '@/utils/apiError.js';
import { ErrorCodes } from '@/utils/errorCodes.js';
import { expectError } from '@/utils/expectError.js';
import { ApiResponse } from '@/utils/apiResponse.js';

export async function handleGetDevices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;

    const [err, devices] = await expectError(getUserDevices(userId));
    if (err) {
      next(new APIError('Failed to fetch devices.', 500));
      return;
    }

    ApiResponse.success(res, devices);
  } catch (error) {
    next(error);
  }
}

export async function handleGetDeviceHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const deviceId = req.query['deviceId'] as string;

    const [settingsErr, settings] = await expectError(getUserSettings(userId));
    if (settingsErr) {
      next(new APIError('Failed to fetch settings.', 500));
      return;
    }
    const mode = settings.history_mode;

    const [err, rows] = await expectError(getDeviceHistory(deviceId, mode));
    if (err) {
      next(new APIError('Failed to fetch device history.', 500));
      return;
    }

    ApiResponse.success(res, { rows, mode });
  } catch (error) {
    next(error);
  }
}

export async function handleGetDeviceParams(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const deviceId = req.query['deviceId'] as string;

    const [permErr, hasPerm] = await expectError(
      hasDevicePermission(userId, deviceId)
    );
    if (permErr || !hasPerm) {
      ApiResponse.fail(res, ErrorCodes.UNAUTHORIZED_DEVICE_ACCESS, 403);
      return;
    }

    const [err, params] = await expectError(getDeviceParameters(deviceId));
    if (err) {
      next(new APIError('Failed to fetch device parameters.', 500));
      return;
    }

    ApiResponse.success(res, params);
  } catch (error) {
    next(error);
  }
}

export async function handleGetDeviceRecords(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const deviceId = req.query['deviceId'] as string;
    const date = req.query['date'] as string;
    const timezone = req.query['timezone'] as string;
    const resolution = (req.query['resolution'] as 'hour' | 'minute') || 'hour';

    if (!deviceId || !date || !timezone) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const [permErr, hasPerm] = await expectError(
      hasDevicePermission(userId, deviceId)
    );
    if (permErr || !hasPerm) {
      ApiResponse.fail(res, ErrorCodes.UNAUTHORIZED_DEVICE_ACCESS, 403);
      return;
    }

    const [err, rows] = await expectError(
      getDeviceRecordsByDate(deviceId, date, timezone, resolution)
    );
    if (err) {
      next(new APIError('Failed to fetch device records.', 500));
      return;
    }
    ApiResponse.success(res, { rows });
  } catch (error) {
    next(error);
  }
}

export async function handleGetAvailableDates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const deviceId = req.query['deviceId'] as string;
    const timezone = req.query['timezone'] as string;

    if (!deviceId || !timezone) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const [permErr, hasPerm] = await expectError(
      hasDevicePermission(userId, deviceId)
    );
    if (permErr || !hasPerm) {
      ApiResponse.fail(res, ErrorCodes.UNAUTHORIZED_DEVICE_ACCESS, 403);
      return;
    }

    const [err, dates] = await expectError(
      getAvailableDates(deviceId, timezone)
    );
    if (err) {
      next(new APIError('Failed to fetch available dates.', 500));
      return;
    }
    ApiResponse.success(res, { dates });
  } catch (error) {
    next(error);
  }
}
