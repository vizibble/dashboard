import pool from '@/service/dbConnection.js';
import type { Device, DeviceOwnerInfo, HistoryRow } from '@/types/index.js';
import { formatParamLabel } from '@/utils/formatParam.js';

export async function getUserDevices(userId: string): Promise<Device[]> {
  const result = await pool.query<Device>(
    `SELECT 
       device_id, user_id, name, type, location, created_at, updated_at
     FROM devices
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getDeviceHistory(
  deviceId: string,
  mode: 'instant' | 'daily' | 'monthly' = 'instant',
  timezone = 'Asia/Kolkata'
): Promise<HistoryRow[]> {
  const deviceResult = await pool.query<{ type: string }>(
    'SELECT type FROM devices WHERE device_id = $1',
    [deviceId]
  );
  const type = deviceResult.rows[0]?.type;

  let truncation = 'minute';
  let startTimeExpr = `date_trunc('day', NOW(), $3)`;

  if (mode === 'instant' || mode === 'daily') {
    if (type === 'production_count') {
      startTimeExpr = `NOW() - INTERVAL '30 hours'`;
    } else {
      startTimeExpr = `date_trunc('day', NOW(), $3)`;
    }
    if (mode === 'daily') truncation = 'hour';
  } else if (mode === 'monthly') {
    truncation = 'day';
    startTimeExpr = `date_trunc('day', NOW() - INTERVAL '30 days', $3)`;
  }

  const result = await pool.query<HistoryRow>(
    `
    WITH aggregated_data AS (
      SELECT 
        date_trunc($2, recorded_at, CAST($3 AS text)) AS trunc_time,
        key,
        AVG(value::numeric) AS avg_value
      FROM sensor_readings
      CROSS JOIN jsonb_each_text(payload)
      WHERE device_id = $1
        AND recorded_at >= ${startTimeExpr}
      GROUP BY trunc_time, key
    )
    SELECT 
      jsonb_object_agg(key, ROUND(avg_value, 2)) AS payload,
      trunc_time AS recorded_at
    FROM aggregated_data
    GROUP BY trunc_time
    ORDER BY trunc_time ASC
    `,
    [deviceId, truncation, timezone]
  );
  return result.rows;
}

export async function getDeviceRecordsByDate(
  deviceId: string,
  dateString: string,
  timezone = 'Asia/Kolkata',
  resolution: 'hour' | 'minute' = 'hour'
): Promise<HistoryRow[]> {
  const result = await pool.query<HistoryRow>(
    `
    WITH aggregated_data AS (
      SELECT 
        date_trunc($4, recorded_at, CAST($3 AS text)) AS trunc_time,
        key,
        AVG(value::numeric) AS avg_value
      FROM sensor_readings
      CROSS JOIN jsonb_each_text(payload)
      WHERE device_id = $1
        AND recorded_at >= ($2 || ' 00:00:00 ' || $3)::timestamptz
        AND recorded_at < ($2 || ' 00:00:00 ' || $3)::timestamptz + INTERVAL '1 day'
      GROUP BY trunc_time, key
    )
    SELECT 
      jsonb_object_agg(key, ROUND(avg_value, 2)) AS payload,
      trunc_time AS recorded_at
    FROM aggregated_data
    GROUP BY trunc_time
    ORDER BY trunc_time ASC
    `,
    [deviceId, dateString, timezone, resolution]
  );
  return result.rows;
}

export async function getAvailableDates(
  deviceId: string,
  timezone = 'Asia/Kolkata'
): Promise<string[]> {
  const result = await pool.query<{ date: Date }>(
    `
    SELECT DISTINCT date_trunc('day', recorded_at, CAST($2 AS text)) AS date
    FROM sensor_readings
    WHERE device_id = $1
    ORDER BY date DESC
    `,
    [deviceId, timezone]
  );
  // Return in YYYY-MM-DD format based on the database returned localized date
  return result.rows.map((r) => {
    const d = new Date(r.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
}

export async function getDeviceOwnerInfo(
  deviceId: string
): Promise<DeviceOwnerInfo | null> {
  const result = await pool.query<DeviceOwnerInfo>(
    `
    SELECT 
      u.email, 
      COALESCE(array_agg(uae.email) FILTER (WHERE uae.email IS NOT NULL), '{}') AS "alertEmails",
      d.name AS "deviceName"
    FROM devices d
    JOIN users u ON d.user_id = u.user_id
    LEFT JOIN user_alert_emails uae ON u.user_id = uae.user_id
    WHERE d.device_id = $1
    GROUP BY u.email, d.name
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
