import type { NextFunction, Request, Response } from 'express';

import {
  deleteAlertRule,
  getAlertRulesByDevice,
  getAlertsByUser,
  hasRulePermission,
  insertAlertRule,
} from '@/models/alert.js';
import { hasDevicePermission } from '@/models/auth.js';
import type { AuthenticatedRequest, Condition } from '@/types/index.js';
import { APIError } from '@/utils/apiError.js';
import { ErrorCodes } from '@/utils/errorCodes.js';
import { expectError } from '@/utils/expectError.js';
import { ApiResponse } from '@/utils/apiResponse.js';

const VALID_CONDITIONS: Condition[] = ['gt', 'lt', 'gte', 'lte', 'eq'];

export async function handleGetUserAlerts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;

    const [err, alerts] = await expectError(getAlertsByUser(userId));
    if (err) {
      next(new APIError('Failed to fetch alerts.', 500));
      return;
    }

    ApiResponse.success(res, alerts);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateRule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const { device_id, parameter, condition, threshold, label } = req.body as {
      device_id: string;
      parameter: string;
      condition: string;
      threshold: unknown;
      label?: string;
    };

    if (!device_id || !parameter || !condition || threshold === undefined) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    if (!VALID_CONDITIONS.includes(condition as Condition)) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const thresholdNum = Number(threshold);
    if (isNaN(thresholdNum)) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const [permErr, hasPerm] = await expectError(
      hasDevicePermission(userId, device_id)
    );
    if (permErr || !hasPerm) {
      ApiResponse.fail(res, ErrorCodes.UNAUTHORIZED_DEVICE_ACCESS, 403);
      return;
    }

    const [err, rule] = await expectError(
      insertAlertRule(
        device_id,
        parameter,
        condition as Condition,
        thresholdNum,
        label
      )
    );
    if (err) {
      next(new APIError('Failed to create alert rule.', 500));
      return;
    }

    ApiResponse.success(res, rule, 201, 'Alert rule created successfully');
  } catch (error) {
    next(error);
  }
}

export async function handleGetDeviceRules(
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

    const [err, rules] = await expectError(getAlertRulesByDevice(deviceId));
    if (err) {
      next(new APIError('Failed to fetch alert rules.', 500));
      return;
    }

    ApiResponse.success(res, rules);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteRule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const ruleId = req.params['ruleId'] as string;

    const [permErr, hasPerm] = await expectError(
      hasRulePermission(userId, ruleId)
    );
    if (permErr || !hasPerm) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 403);
      return;
    }

    const [err, deleted] = await expectError(deleteAlertRule(ruleId));
    if (err || !deleted) {
      next(new APIError('Failed to delete alert rule.', 500));
      return;
    }

    ApiResponse.success(
      res,
      { success: true },
      200,
      'Alert rule deleted successfully'
    );
  } catch (error) {
    next(error);
  }
}
