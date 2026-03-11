import pool from '@/db.js';
import { formatParamLabel } from '@/utils/formatParam.js';

export interface Device {
  id: number;
  device_id: string;
  user_id: string;
  name: string;
  type: string;
  location: string;
  created_at: Date;
}
export async function getUserDevices(userId: string): Promise<Device[]> {
  const result = await pool.query<Device>(
    `SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export interface HistoryRow {
  payload: Record<string, number>;
  recorded_at: Date;
}
export async function getDeviceHistory(
  deviceId: string
): Promise<HistoryRow[]> {
  const result = await pool.query<HistoryRow>(
    `
    WITH minute_data AS (
      SELECT 
        date_trunc('minute', recorded_at) AS trunc_time,
        key,
        AVG(value::numeric) AS avg_value
      FROM sensor_readings
      CROSS JOIN jsonb_each_text(payload)
      WHERE device_id = $1
        AND recorded_at >= NOW() - INTERVAL '24 hours'
      GROUP BY trunc_time, key
    )
    SELECT 
      jsonb_object_agg(key, ROUND(avg_value, 2)) AS payload,
      trunc_time AS recorded_at
    FROM minute_data
    GROUP BY trunc_time
    ORDER BY trunc_time ASC
    `,
    [deviceId]
  );
  return result.rows;
}

export interface DeviceOwnerInfo {
  email: string;
  deviceName: string;
}
export async function getDeviceOwnerInfo(
  deviceId: string
): Promise<DeviceOwnerInfo | null> {
  const result = await pool.query<DeviceOwnerInfo>(
    `
    SELECT u.email, d.name AS "deviceName"
    FROM devices d
    JOIN users u ON d.user_id = u.user_id
    WHERE d.device_id = $1
    LIMIT 1
    `,
    [deviceId]
  );
  return result.rows[0] ?? null;
}

export async function getDeviceParameters(deviceId: string): Promise<string[]> {
  const result = await pool.query<{ key: string }>(
    `
    SELECT DISTINCT jsonb_object_keys(payload) AS key
    FROM sensor_readings
    WHERE device_id = $1
    ORDER BY key
    `,
    [deviceId]
  );
  return result.rows.map((r) => formatParamLabel(r.key));
}
