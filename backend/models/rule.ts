import pool from '@/db.js';

export type Condition = "gt" | "lt" | "gte" | "lte" | "eq";

export interface AlertRule {
  id: string;
  rule_id: string;
  device_id: string;
  parameter: string;
  condition: Condition;
  threshold: number;
  label: string | null;
  enabled: boolean;
  created_at: Date;
}

export async function insertAlertRule(
  deviceId: string,
  parameter: string,
  condition: Condition,
  threshold: number,
  label?: string,
): Promise<AlertRule> {
  const result = await pool.query<AlertRule>(
    `INSERT INTO alert_rules (device_id, parameter, condition, threshold, label)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [deviceId, parameter, condition, threshold, label ?? null],
  );
  return result.rows[0]!;
}

export async function getAlertRulesByDevice(
  deviceId: string,
): Promise<AlertRule[]> {
  const result = await pool.query<AlertRule>(
    `SELECT * FROM alert_rules WHERE device_id = $1 ORDER BY created_at DESC`,
    [deviceId],
  );
  return result.rows;
}

export async function getActiveRulesForDevice(
  deviceId: string,
): Promise<AlertRule[]> {
  const result = await pool.query<AlertRule>(
    `SELECT * FROM alert_rules WHERE device_id = $1 AND enabled = TRUE ORDER BY created_at DESC`,
    [deviceId],
  );
  return result.rows;
}

export async function deleteAlertRule(ruleId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM alert_rules WHERE rule_id = $1`,
    [ruleId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Checks whether a rule_id belongs to a device owned by a given user. */
export async function hasRulePermission(
  userId: string,
  ruleId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM alert_rules ar
     JOIN devices d ON ar.device_id = d.device_id
     WHERE d.user_id = $1 AND ar.rule_id = $2`,
    [userId, ruleId],
  );
  return (result.rowCount ?? 0) > 0;
}
