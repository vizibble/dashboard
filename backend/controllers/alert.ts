import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '@/middleware/auth.js';
import { getAlertsByUser } from '@/models/alert.js';
import { expectError } from '@/utils/expectError.js';
import { getTimestamp } from '@/utils/time.js';

export async function handleGetUserAlerts(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.user_id;

  const [err, alerts] = await expectError(getAlertsByUser(userId));
  if (err) {
    console.error(
      `[${getTimestamp()}] Failed to fetch alerts for user ${userId}:`,
      err
    );
    res.status(500).json({ error: 'Failed to fetch alerts.' });
    return;
  }

  res.status(200).json(alerts);
}
