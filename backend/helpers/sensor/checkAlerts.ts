import { getActiveRulesForDevice, insertAlert } from '@/models/alert.js';
import { getDeviceOwnerInfo } from '@/models/device.js';
import { emailQueue } from '@/service/bullMQQueue.js';
import redisConnection from '@/service/redisConnection.js';
import type {
  AlertRule,
  AlertRuleRow,
  Condition,
  EmailJobData,
} from '@/types/index.js';
import { expectError } from '@/utils/expectError.js';
import { formatParamLabel } from '@/utils/formatParam.js';
import { getTimestamp } from '@/utils/time.js';

// Alert dedup TTL: one email per rule per device per hour
const DEDUP_TTL_SECONDS = 60 * 60;

function dedupKey(deviceId: string, ruleId: string): string {
  return `alert:dedup:${deviceId}:${ruleId}`;
}

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
    default:
      return false;
  }
}

export async function checkAlerts(
  deviceId: string,
  payload: Record<string, number>
): Promise<void> {
  const [[rulesErr, rules], [ownerErr, ownerInfo]] = await Promise.all([
    expectError(getActiveRulesForDevice(deviceId)),
    expectError(getDeviceOwnerInfo(deviceId)),
  ]);

  if (rulesErr || !rules) {
    console.error(`[${getTimestamp()}] Failed to fetch rules.`, rulesErr);
    return;
  }

  if (!rules.length) return;

  if (ownerErr || !ownerInfo) {
    console.error(`[${getTimestamp()}] Failed to fetch owner.`, ownerErr);
    return;
  }

  // Filter triggered rules
  const triggered = rules
    .map((rule) => {
      const value = payload[rule.parameter];
      if (
        value === undefined ||
        !checkCondition(value, rule.condition, Number(rule.threshold))
      ) {
        return null;
      }
      return { rule, value };
    })
    .filter(Boolean) as { rule: AlertRule; value: number }[];

  if (!triggered.length) return;

  // Dedup: skip rules that fired recently using atomic SET NX
  const fresh: { rule: AlertRule; value: number }[] = [];
  for (const item of triggered) {
    const key = dedupKey(deviceId, item.rule.rule_id);
    // SET key 1 EX TTL NX returns 'OK' only if it didn't exist
    const result = await redisConnection.set(
      key,
      '1',
      'EX',
      DEDUP_TTL_SECONDS,
      'NX'
    );
    if (result === 'OK') {
      fresh.push(item);
    }
  }

  if (!fresh.length) return; // All recently triggered within TTL

  // Insert DB rows for fresh alerts
  const inserts = await Promise.all(
    fresh.map(async ({ rule, value }) => {
      const [err, alert] = await expectError(
        insertAlert(deviceId, rule.parameter, String(value))
      );
      return { rule, value, err, alert };
    })
  );

  // Build recipients
  const recipients = ownerInfo.alertEmails ?? [];
  const recipient = recipients.join(',');
  if (!recipient) return;

  const ruleRows: AlertRuleRow[] = [];
  let firedAt: string = new Date().toISOString();

  for (const { rule, value, err, alert } of inserts) {
    if (err || !alert) {
      console.error(
        `[${getTimestamp()}] Failed to insert alert for rule ${rule.rule_id}:`,
        err
      );
      continue;
    }

    console.log(
      `[${getTimestamp()}] Alert fired for device=${deviceId} rule=${rule.rule_id}`
    );
    firedAt = alert.recorded_at.toISOString();

    ruleRows.push({
      parameter: formatParamLabel(rule.parameter),
      condition: rule.condition,
      threshold: Number(rule.threshold),
      actualValue: String(value),
      label: rule.label,
    });
  }

  if (!ruleRows.length) return;

  // One grouped email job per device batch
  const job: EmailJobData = {
    to: recipient,
    deviceName: ownerInfo.deviceName,
    firedAt,
    rules: ruleRows,
  };

  await emailQueue.add('send-alert', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
