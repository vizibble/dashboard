import pool from '@/db.js';

export interface User {
  id: number;
  user_id: string;
  email: string;
  password: string;
  name: string;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function hasDevicePermission(
  userId: string,
  deviceId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM devices WHERE user_id = $1 AND device_id = $2`,
    [userId, deviceId]
  );
  return (result.rowCount ?? 0) > 0;
}
