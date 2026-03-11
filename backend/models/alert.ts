import pool from '@/db.js';
import { formatParamLabel } from '@/utils/formatParam.js';

export interface Alert {
  id: string;
  device_id: string;
  parameter: string;
  value: string;
  recorded_at: Date;
  device_name: string;
  device_location: string;
}

export async function insertAlert(
  deviceId: string,
  parameter: string,
  value: string,
): Promise<Alert> {
  const result = await pool.query<Alert>(
    `INSERT INTO alerts (device_id, parameter, value) VALUES ($1, $2, $3) RETURNING *`,
    [deviceId, parameter, value],
  );
  
  const alert = result.rows[0]!;
  return {
    ...alert,
    parameter: formatParamLabel(alert.parameter)
  };
}

export async function getAlertsByUser(userId: string): Promise<Alert[]> {
  const result = await pool.query<Alert>(
    `SELECT a.*, d.name as device_name, d.location as device_location 
    FROM alerts a
    JOIN devices d ON a.device_id = d.device_id
    WHERE d.user_id = $1
    ORDER BY a.recorded_at DESC
    `,
    [userId],
  );
  return result.rows.map((row) => ({
    ...row,
    parameter: formatParamLabel(row.parameter)
  }));
}
