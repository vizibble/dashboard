import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '@/middleware/auth.js';
import { hasDevicePermission } from '@/models/auth';
import {
  getDeviceHistory,
  getDeviceParameters,
  getUserDevices,
  getDeviceRecordsByDate,
  getAvailableDates,
} from '@/models/device.js';
import { getUserSettings } from '@/models/user.js';
import { expectError } from '@/utils/expectError.js';
import { getTimestamp } from '@/utils/time.js';

export async function handleGetDevices(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;

  const [err, devices] = await expectError(getUserDevices(userId));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch devices for user ${userId}:`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch devices.' });
    return;
  }

  res.status(200).json(devices);
}

export async function handleGetDeviceHistory(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const deviceId = req.query['deviceId'] as string;

  const [settingsErr, settings] = await expectError(getUserSettings(userId));
  if (settingsErr) {
    console.error(
      `[${getTimestamp()}] Failed to fetch settings for user ${userId}:`,
      settingsErr
    );
    res.status(500).json({ error: 'Failed to fetch settings.' });
    return;
  }
  const mode = settings.history_mode;

  const [err, rows] = await expectError(getDeviceHistory(deviceId, mode));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch history for device '${deviceId}':`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch device history.' });
    return;
  }
  res.status(200).json({ rows, mode });
}

export async function handleGetDeviceParams(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const deviceId = req.query['deviceId'] as string;

  const [permErr, hasPerm] = await expectError(
    hasDevicePermission(userId, deviceId)
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: 'Device not found.' });
    return;
  }

  const [err, params] = await expectError(getDeviceParameters(deviceId));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch params for device ${deviceId}:`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch device parameters.' });
    return;
  }

  res.status(200).json(params);
}

export async function handleGetDeviceRecords(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const deviceId = req.query['deviceId'] as string;
  const date = req.query['date'] as string;
  const timezone = (req.query['timezone'] as string) || 'Asia/Kolkata';

  if (!deviceId || !date) {
    res.status(400).json({ error: 'deviceId and date are required parameters.' });
    return;
  }

  const [permErr, hasPerm] = await expectError(
    hasDevicePermission(userId, deviceId)
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: 'Device not found.' });
    return;
  }

  const [err, rows] = await expectError(getDeviceRecordsByDate(deviceId, date, timezone));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch records for device '${deviceId}' on '${date}':`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch device records.' });
    return;
  }
  res.status(200).json({ rows });
}

export async function handleGetAvailableDates(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const deviceId = req.query['deviceId'] as string;
  const timezone = (req.query['timezone'] as string) || 'Asia/Kolkata';

  if (!deviceId) {
    res.status(400).json({ error: 'deviceId is a required parameter.' });
    return;
  }

  const [permErr, hasPerm] = await expectError(
    hasDevicePermission(userId, deviceId)
  );
  if (permErr || !hasPerm) {
    res.status(403).json({ error: 'Device not found.' });
    return;
  }

  const [err, dates] = await expectError(getAvailableDates(deviceId, timezone));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch available dates for device '${deviceId}':`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch available dates.' });
    return;
  }
  res.status(200).json({ dates });
}
