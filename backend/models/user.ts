import pool from '@/service/dbConnection.js';
import type { UserSettings } from '@/types/index.js';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const result = await pool.query<UserSettings>(
    `SELECT 
       us.history_mode,
       COALESCE(array_agg(uae.email) FILTER (WHERE uae.email IS NOT NULL), '{}') AS alert_emails
     FROM user_settings us
     LEFT JOIN user_alert_emails uae ON us.user_id = uae.user_id
     WHERE us.user_id = $1
     GROUP BY us.user_id, us.history_mode`,
    [userId]
  );
  return result.rows[0] ?? { history_mode: 'instant', alert_emails: [] };
}

export async function updateUserSettings(
  userId: string,
  settings: UserSettings
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update user_settings
    await client.query(
      `INSERT INTO user_settings (user_id, history_mode)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE 
       SET history_mode = COALESCE($2, user_settings.history_mode),
           updated_at = NOW()`,
      [userId, settings.history_mode ?? null]
    );

    // Update alert_emails if provided
    if (settings.alert_emails !== undefined) {
      await client.query('DELETE FROM user_alert_emails WHERE user_id = $1', [userId]);
      if (settings.alert_emails && settings.alert_emails.length > 0) {
        await client.query(
          `INSERT INTO user_alert_emails (user_id, email)
           SELECT $1, unnest($2::text[])`,
          [userId, settings.alert_emails]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
