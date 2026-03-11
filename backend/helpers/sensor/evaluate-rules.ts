import { sendAlertEmail } from '@/helpers/sensor/mailer.js';
import { insertAlert } from '@/models/alert.js';
import { getDeviceOwnerInfo } from '@/models/device.js';
import type { Condition } from '@/models/rule.js';
import { type AlertRule, getActiveRulesForDevice } from '@/models/rule.js';
import { expectError } from '@/utils/expectError';
import { getTimestamp } from '@/utils/time';

/** Evaluate a single condition against a value. */
function checkCondition(
  value: number,
  condition: Condition,
  threshold: number
): boolean {
  switch (condition) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    case 'eq':
      return value === threshold;
  }
}

export async function evaluateAlertRules(
  deviceId: string,
  payload: Record<string, number>
): Promise<void> {
  // Fetch rules and owner info
  const [[rulesErr, rules], [ownerErr, ownerInfo]] = await Promise.all([
    expectError(getActiveRulesForDevice(deviceId)),
    expectError(getDeviceOwnerInfo(deviceId)),
  ]);

  if (rulesErr || !rules || rules.length === 0) return;
  if (ownerErr) {
    console.error(`[${getTimestamp()}] Failed to fetch owner.`, ownerErr);
  }

  // Determine which rules are triggered
  const triggered: { rule: AlertRule; alertValue: string }[] = [];
  for (const rule of rules) {
    const value = payload[rule.parameter];
    if (
      value !== undefined &&
      checkCondition(value, rule.condition, Number(rule.threshold))
    ) {
      triggered.push({ rule, alertValue: String(value) });
    }
  }

  if (triggered.length === 0) return;

  // Insert all triggered alerts in parallel
  const insertResults = await Promise.all(
    triggered.map(({ rule, alertValue }) =>
      expectError(insertAlert(deviceId, rule.parameter, alertValue)).then(
        ([err, alert]) => ({ rule, alertValue, err, alert })
      )
    )
  );

  // Handle results and fire emails
  for (const { rule, alertValue, err, alert } of insertResults) {
    if (err || !alert) {
      console.error(
        `[${getTimestamp()}] Failed to insert alert for rule ${rule.rule_id}:`,
        err
      );
      continue;
    }

    console.log(
      `[${getTimestamp()}] Alert fired: device=${deviceId} param=${rule.parameter} value=${alertValue} (${rule.condition} ${rule.threshold})`
    );

    if (ownerInfo) {
      void sendAlertEmail({
        to: ownerInfo.email,
        deviceName: ownerInfo.deviceName,
        parameter: rule.parameter,
        condition: rule.condition,
        threshold: Number(rule.threshold),
        actualValue: alertValue,
        label: rule.label,
        firedAt: alert.recorded_at,
      }).catch((emailErr) => {
        console.error(
          `[${getTimestamp()}] Failed to send alert email for rule ${rule.rule_id}:`,
          emailErr
        );
      });
    }
  }
}
