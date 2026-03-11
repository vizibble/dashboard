import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '@/middleware/auth.js';
import { hasDevicePermission } from '@/models/auth.js';
import {
  type Condition, deleteAlertRule, getAlertRulesByDevice,
  hasRulePermission, insertAlertRule,
} from '@/models/rule.js';
import { expectError } from '@/utils/expectError.js';
import { getTimestamp } from '@/utils/time.js';

const VALID_CONDITIONS: Condition[] = ["gt", "lt", "gte", "lte", "eq"];

export async function handleCreateRule(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const { device_id, parameter, condition, threshold, label } = req.body as {
    device_id: string;
    parameter: string;
    condition: string;
    threshold: unknown;
    label?: string;
  };

  if (!device_id || !parameter || !condition || threshold === undefined) {
    res.status(400).json({
      error:
        "Missing required fields: device_id, parameter, condition, threshold.",
    });
    return;
  }

  if (!VALID_CONDITIONS.includes(condition as Condition)) {
    res.status(400).json({ error: "Invalid condition." });
    return;
  }

  const thresholdNum = Number(threshold);
  if (isNaN(thresholdNum)) {
    res.status(400).json({ error: "Threshold must be a number." });
    return;
  }

  // Verify the user owns this device
  const [permErr, hasPerm] = await expectError(
    hasDevicePermission(userId, device_id),
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: "Device not found." });
    return;
  }

  const [err, rule] = await expectError(
    insertAlertRule(
      device_id,
      parameter,
      condition as Condition,
      thresholdNum,
      label,
    ),
  );
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to create alert rule for device ${device_id}:`,
      err,
    );
    res.status(500).json({ error: "Failed to create alert rule." });
    return;
  }

  res.status(201).json(rule);
}

export async function handleGetDeviceRules(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const deviceId = req.query["deviceId"] as string;

  const [permErr, hasPerm] = await expectError(
    hasDevicePermission(userId, deviceId),
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: "Device not found." });
    return;
  }

  const [err, rules] = await expectError(getAlertRulesByDevice(deviceId));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch alert rules for device ${deviceId}:`,
      err,
    );
    res.status(500).json({ error: "Failed to fetch alert rules." });
    return;
  }

  res.status(200).json(rules);
}

export async function handleDeleteRule(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const ruleId = req.body.ruleId as string;

  const [permErr, hasPerm] = await expectError(
    hasRulePermission(userId, ruleId),
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: "Alert rule not found." });
    return;
  }

  const [err, deleted] = await expectError(deleteAlertRule(ruleId));
  if (err || !deleted) {
    console.error(
      `[${getTimestamp()}] Failed to delete alert rule ${ruleId}:`,
      err,
    );
    res.status(500).json({ error: "Failed to delete alert rule." });
    return;
  }

  res.status(200).json({ success: true });
}
