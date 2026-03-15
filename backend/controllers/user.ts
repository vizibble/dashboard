import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/middleware/auth.js';
import { getUserSettings, updateUserSettings } from '@/models/user.js';
import { expectError } from '@/utils/expectError.js';
import { getTimestamp } from '@/utils/time.js';

export async function handleGetSettings(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;

  const [err, settings] = await expectError(getUserSettings(userId));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch settings for user ${userId}:`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch settings.' });
    return;
  }

  res.status(200).json(settings);
}

export async function handleUpdateSettings(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;
  const settings = req.body;

  const [err] = await expectError(updateUserSettings(userId, settings));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to update settings for user ${userId}:`,
      err
    );
    res.status(500).json({ error: 'Failed to update settings.' });
    return;
  }

  res.status(200).json({ message: 'Settings updated successfully.' });
}
