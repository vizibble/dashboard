import type { Request, Response } from 'express';

import { insertSensorData } from '@/models/sensor.js';
import { emitToFrontend } from '@/sockets/index.js';
import { expectError } from '@/utils/expectError.js';

export async function handleSensorData(
  req: Request,
  res: Response
): Promise<void> {
  const { device_id, ...rest } = req.body as Record<string, unknown>;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof device_id !== 'string' || !uuidRegex.test(device_id)) {
    res.status(400).json({ error: 'Invalid device ID.' });
    return;
  }

  const sensorPayload: Record<string, number> = {};
  for (const [key, val] of Object.entries(rest)) {
    const num = Number(val);
    if (isNaN(num)) continue;
    sensorPayload[key] = num;
  }
  if (Object.keys(sensorPayload).length === 0) {
    res.status(400).json({ error: 'No valid sensor data provided.' });
    return;
  }

  const [insertErr, sensorRow] = await expectError(
    insertSensorData(device_id, sensorPayload)
  );
  if (insertErr) {
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  emitToFrontend(`device-${device_id}`, 'update', {
    connectionID: device_id,
    ...sensorPayload,
    timestamp: sensorRow.recorded_at,
  });

  res.status(200).json({ success: true });

  // Evaluate alert rules in a non-blocking way
  // void evaluateAlertRules(device_id, sensorPayload);
}
