import pool from '@/db.js';
import { formatParamLabel } from '@/utils/formatParam.js';

export interface Device {
  id: number;
  device_id: string;
  user_id: string;
  device_info: {
    name: string;
    type: string;
    location: string;
  };
  created_at: Date;
}
export async function getUserDevices(userId: string): Promise<Device[]> {
  const result = await pool.query<Device>(
    `SELECT 
       d.id, d.device_id, d.user_id, d.created_at,
       json_build_object(
         'name', COALESCE(di.name, 'Unknown'),
         'type', COALESCE(di.type, 'Unknown'),
         'location', COALESCE(di.location, 'Unknown')
       ) AS device_info
     FROM devices d
     LEFT JOIN device_info di ON d.device_id = di.device_id
     WHERE d.user_id = $1 
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export interface HistoryRow {
  payload: Record<string, number>;
  recorded_at: Date;
}
export async function getDeviceHistory(
  deviceId: string,
  mode = 'instant',
  timezone = 'Asia/Kolkata'
): Promise<HistoryRow[]> {
  let truncation = 'minute';
  let startTimeExpr = `date_trunc('day', NOW(), $3)`;

  if (mode === 'daily') {
    truncation = 'hour';
    startTimeExpr = `date_trunc('day', NOW(), $3)`;
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
  timezone = 'Asia/Kolkata'
): Promise<HistoryRow[]> {
  const result = await pool.query<HistoryRow>(
    `
    WITH aggregated_data AS (
      SELECT 
        date_trunc('hour', recorded_at, CAST($3 AS text)) AS trunc_time,
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
    [deviceId, dateString, timezone]
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

export interface DeviceOwnerInfo {
  email: string;
  alertEmails?: string[];
  deviceName: string;
}
export async function getDeviceOwnerInfo(
  deviceId: string
): Promise<DeviceOwnerInfo | null> {
  const result = await pool.query<DeviceOwnerInfo>(
    `
    SELECT 
      u.email, 
      us.alert_emails AS "alertEmails",
      di.name AS "deviceName"
    FROM devices d
    JOIN users u ON d.user_id = u.user_id
    LEFT JOIN user_settings us ON u.user_id = us.user_id
    LEFT JOIN device_info di ON d.device_id = di.device_id
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
