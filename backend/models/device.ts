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
  // Resolve device type first (needed for instant/daily start-time logic).
  const deviceResult = await pool.query<{ type: string }>(
    'SELECT type FROM devices WHERE device_id = $1',
    [deviceId]
  );
  const type = deviceResult.rows[0]?.type;

  let truncation: string;
  let startTimeExpr: string;

  if (mode === 'monthly') {
    truncation = 'day';
    // date_trunc with 3 args is timezone-aware and returns timestamptz directly.
    // Subtract 29 days so today is day 30 and we get exactly 30 calendar days.
    startTimeExpr = `date_trunc('day', NOW(), $3) - INTERVAL '29 days'`;
  } else {
    truncation = mode === 'daily' ? 'hour' : 'minute';
    startTimeExpr =
      type === 'production_count' || type === 'count'
        ? `NOW() - INTERVAL '30 hours'`
        : `date_trunc('day', NOW(), $3)`;
  }

  const result = await pool.query<HistoryRow>(
    `
    WITH aggregated_data AS (
      SELECT
        date_trunc($2, recorded_at, CAST($3 AS text)) AS trunc_time,
        key,
        CASE
          WHEN key IN ('count', 'length') THEN (SUM(value::numeric) FILTER (WHERE value ~ '^-?[0-9]+(\\.[0-9]+)?$'))::text
          WHEN bool_and(value ~ '^-?[0-9]+(\\.[0-9]+)?$') THEN (AVG(value::numeric) FILTER (WHERE value ~ '^-?[0-9]+(\\.[0-9]+)?$'))::text
          ELSE MAX(value)
        END AS val
      FROM sensor_readings
      CROSS JOIN jsonb_each_text(payload)
      WHERE device_id = $1
        AND recorded_at >= ${startTimeExpr}
        ${mode === 'monthly' ? 'AND EXTRACT(MINUTE FROM recorded_at)::int % 5 = 0' : ''}
      GROUP BY trunc_time, key
    )
    SELECT
      jsonb_object_agg(key, 
        CASE 
          WHEN val ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN to_jsonb(ROUND(val::numeric, 2)) 
          ELSE to_jsonb(val) 
        END
      ) AS payload,
      trunc_time                                 AS recorded_at
    FROM aggregated_data
    GROUP BY trunc_time
    ORDER BY trunc_time ASC
    LIMIT ${mode === 'monthly' ? 31 : 2000}
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
  // $2::date AT TIME ZONE $3 is type-safe, computed once by the planner,
  // and produces a proper timestamptz bound — no string concat needed.
  const result = await pool.query<HistoryRow>(
    `
    WITH
      bounds AS (
        SELECT
          ($2::date)::timestamp AT TIME ZONE $3                         AS day_start,
          ($2::date + INTERVAL '1 day')::timestamp AT TIME ZONE $3     AS day_end
      ),
      aggregated_data AS (
        SELECT
          date_trunc($4, recorded_at, CAST($3 AS text)) AS trunc_time,
          key,
          CASE
            WHEN key IN ('count', 'length') THEN (SUM(value::numeric) FILTER (WHERE value ~ '^-?[0-9]+(\\.[0-9]+)?$'))::text
            WHEN bool_and(value ~ '^-?[0-9]+(\\.[0-9]+)?$') THEN (AVG(value::numeric) FILTER (WHERE value ~ '^-?[0-9]+(\\.[0-9]+)?$'))::text
            ELSE MAX(value)
          END AS val
        FROM sensor_readings, bounds
        CROSS JOIN jsonb_each_text(payload)
        WHERE device_id = $1
          AND recorded_at >= bounds.day_start
          AND recorded_at <  bounds.day_end
        GROUP BY trunc_time, key
      )
    SELECT
      jsonb_object_agg(key, 
        CASE 
          WHEN val ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN to_jsonb(ROUND(val::numeric, 2)) 
          ELSE to_jsonb(val) 
        END
      ) AS payload,
      trunc_time                                 AS recorded_at
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
  // Recursive index-skip-scan: jumps to the next distinct day using the
  // existing (device_id, recorded_at DESC) index — O(distinct_days) not O(all_rows).
  const result = await pool.query<{ date: Date }>(
    `
    WITH RECURSIVE date_scan AS (
      -- Anchor: most recent reading for this device (one index seek)
      (
        SELECT recorded_at AS day_start
        FROM sensor_readings
        WHERE device_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1
      )

      UNION ALL

      -- Step: jump to the first row before the start of the current day
      -- uses 3-arg date_trunc(field, source, timezone)
      SELECT s.recorded_at AS day_start
      FROM date_scan ds
      JOIN LATERAL (
        SELECT recorded_at
        FROM sensor_readings
        WHERE device_id = $1
          AND recorded_at < date_trunc('day', ds.day_start, CAST($2 AS text))
        ORDER BY recorded_at DESC
        LIMIT 1
      ) s ON TRUE
    )
    SELECT date_trunc('day', day_start, CAST($2 AS text))::date AS date
    FROM date_scan
    ORDER BY date DESC
    LIMIT 365
    `,
    [deviceId, timezone]
  );
  return result.rows.map((r) => {
    const d = new Date(r.date);
    const year  = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day   = String(d.getUTCDate()).padStart(2, '0');
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
  // Sample only the latest 100 readings — payload keys are stable and this
  // turns a full-table DISTINCT scan into a bounded index range scan.
  const result = await pool.query<{ key: string }>(
    `
    SELECT DISTINCT jsonb_object_keys(payload) AS key
    FROM (
      SELECT payload
      FROM sensor_readings
      WHERE device_id = $1
      ORDER BY recorded_at DESC
      LIMIT 10
    ) recent
    ORDER BY key
    `,
    [deviceId]
  );
  return result.rows.map((r) => formatParamLabel(r.key));
}
