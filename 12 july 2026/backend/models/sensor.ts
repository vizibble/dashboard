import pool from '@/service/dbConnection.js';

export interface SensorDataRow {
  id: number;
  device_id: string;
  payload: Record<string, unknown>;
  recorded_at: Date;
}

export async function insertSensorData(
  deviceId: string,
  payload: Record<string, unknown>
): Promise<SensorDataRow> {
  const result = await pool.query<SensorDataRow>(
    `INSERT INTO sensor_readings (device_id, payload) VALUES ($1, $2) RETURNING *`,
    [deviceId, payload]
  );
  return result.rows[0]!;
}
