import type { NextFunction, Request, Response } from 'express';

import { checkAlerts } from '@/helpers/sensor/checkAlerts.js';
import { insertSensorData } from '@/models/sensor.js';
import { emitToFrontend } from '@/sockets/index.js';
import { APIError } from '@/utils/apiError.js';
import { ErrorCodes } from '@/utils/errorCodes.js';
import { expectError } from '@/utils/expectError.js';
import { ApiResponse } from '@/utils/apiResponse.js';

export async function handleSensorData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { device_id, ...rest } = req.body as Record<string, unknown>;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof device_id !== 'string' || !uuidRegex.test(device_id)) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const sensorPayload: Record<string, number | string> = {};

    for (const [key, val] of Object.entries(rest)) {
      if (typeof val === "string") {
        const trimmed = val.trim();

        if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
          sensorPayload[key] = Number(trimmed);
        } else {
          sensorPayload[key] = val;
        }
      } else {
        sensorPayload[key] = val as number;
      }
    }

    if (Object.keys(sensorPayload).length === 0) {
      ApiResponse.fail(res, ErrorCodes.VALIDATION_ERROR, 400);
      return;
    }

    const [insertErr, sensorRow] = await expectError(
      insertSensorData(device_id, sensorPayload)
    );
    if (insertErr) {
      next(new APIError('Internal Server Error', 500));
      return;
    }

    emitToFrontend(`device-${device_id}`, 'update', {
      connectionID: device_id,
      ...sensorPayload,
      timestamp: sensorRow.recorded_at,
    });

    ApiResponse.success(res, { success: true });

    // Evaluate alert rules in a non-blocking way
    // void checkAlerts(device_id, sensorPayload);
  } catch (error) {
    next(error);
  }
}
