import pool from '@/db.js';

export interface UserSettings {
  alert_emails?: string[];
  history_mode?: 'instant' | 'daily' | 'monthly';
}

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
     SET alert_emails = EXCLUDED.alert_emails,
         history_mode = EXCLUDED.history_mode,
         updated_at = NOW()`,
    [userId, settings.alert_emails || [], settings.history_mode || 'instant']
  );
}
