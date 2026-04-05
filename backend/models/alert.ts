import pool from '@/service/dbConnection.js';
import type { Alert, AlertRule, Condition } from '@/types/index.js';
import { formatParamLabel } from '@/utils/formatParam.js';

export async function insertAlert(
  deviceId: string,
  parameter: string,
  value: string
): Promise<Alert> {
  const result = await pool.query<Alert>(
    `INSERT INTO alerts (device_id, parameter, value) VALUES ($1, $2, $3) RETURNING *`,
    [deviceId, parameter, value]
  );

  const alert = result.rows[0]!;
  return {
    ...alert,
    parameter: formatParamLabel(alert.parameter),
  };
}

export async function getAlertsByUser(userId: string): Promise<Alert[]> {
  const result = await pool.query<Alert>(
    `SELECT a.*, d.name as device_name, d.location as device_location, d.type as device_type
    FROM alerts a
    JOIN devices d ON a.device_id = d.device_id
    WHERE d.user_id = $1
    ORDER BY a.recorded_at DESC
    `,
    [userId]
  );
  return result.rows.map((row) => ({
    ...row,
    parameter: formatParamLabel(row.parameter),
  }));
}

export async function insertAlertRule(
  deviceId: string,
  parameter: string,
  condition: Condition,
  threshold: number,
  label?: string
): Promise<AlertRule> {
  const result = await pool.query<AlertRule>(
    `INSERT INTO alert_rules (device_id, parameter, condition, threshold, label)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [deviceId, parameter, condition, threshold, label ?? null]
  );
  return result.rows[0]!;
}

export async function getAlertRulesByDevice(
  deviceId: string
): Promise<AlertRule[]> {
  const result = await pool.query<AlertRule>(
    `SELECT * FROM alert_rules WHERE device_id = $1 ORDER BY created_at DESC`,
    [deviceId]
  );
  return result.rows;
}

export async function getActiveRulesForDevice(
  deviceId: string
): Promise<AlertRule[]> {
  const result = await pool.query<AlertRule>(
    `SELECT * FROM alert_rules WHERE device_id = $1 AND enabled = TRUE ORDER BY created_at DESC`,
    [deviceId]
  );
  return result.rows;
}

export async function deleteAlertRule(ruleId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM alert_rules WHERE rule_id = $1`,
    [ruleId]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Checks whether a rule_id belongs to a device owned by a given user. */
export async function hasRulePermission(
  userId: string,
  ruleId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM alert_rules ar
     JOIN devices d ON ar.device_id = d.device_id
     WHERE d.user_id = $1 AND ar.rule_id = $2`,
    [userId, ruleId]
  );
  return (result.rowCount ?? 0) > 0;
}
