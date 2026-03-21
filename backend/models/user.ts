import pool from '@/service/dbConnection.js';
import type { UserSettings } from '@/types/index.js';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const result = await pool.query<UserSettings>(
    `SELECT alert_emails, history_mode FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? {};
}

export async function updateUserSettings(
  userId: string,
  settings: UserSettings
): Promise<void> {
  await pool.query(
    `INSERT INTO user_settings (user_id, alert_emails, history_mode)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE 
     SET alert_emails = COALESCE($2, user_settings.alert_emails),
         history_mode = COALESCE($3, user_settings.history_mode),
         updated_at = NOW()`,
    [userId, settings.alert_emails ?? null, settings.history_mode ?? null]
  );
}
