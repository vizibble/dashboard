import transporter from '@/service/nodemailer.js';
import type { AlertMailOptions, AlertRuleRow } from '@/types/index.js';

const CONDITION_LABELS: Record<string, string> = {
  gt: 'greater than',
  gte: 'greater than or equal to',
  lt: 'less than',
  lte: 'less than or equal to',
  eq: 'equal to',
};

const IST = (date: Date) =>
  date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

export async function sendAlertEmail(opts: AlertMailOptions): Promise<void> {
  const ruleCount = opts.rules.length;
  let subject: string;

  if (ruleCount === 1) {
    const rule = opts.rules[0];

    if (rule?.label) {
      subject = `Alert: ${rule.label}`;
    } else {
      subject = `Alert: ${rule?.parameter} threshold crossed on ${opts.deviceName}`;
    }
  } else {
    subject = `Alert: ${ruleCount} thresholds crossed on ${opts.deviceName}`;
  }

  const ruleRows = opts.rules.map((r) => ruleSection(r)).join('');
  const html = template(opts.deviceName, IST(opts.firedAt), ruleRows);

  await transporter.sendMail({
    from: `"Vizibble Alerts" <${process.env['SMTP_USER']}>`,
    to: opts.to,
    subject,
    html,
  });
}

// Helpers
function ruleSection(r: AlertRuleRow): string {
  const conditionLabel = CONDITION_LABELS[r.condition] ?? r.condition;
  const rows = [
    r.label ? row('Label', r.label) : '',
    row('Parameter', r.parameter),
    row('Rule', `${r.parameter} ${conditionLabel} ${r.threshold}`),
    row('Measured Value', `<strong>${r.actualValue}</strong>`),
  ].join('');

  return `
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.07);margin-bottom:16px;">
      <tbody>${rows}</tbody>
    </table>`;
}

function row(label: string, value: string): string {
  return `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:500;width:40%;">${label}</td>
      <td style="padding:12px 16px;font-size:13px;color:#0f172a;">${value}</td>
    </tr>`;
}

function template(
  deviceName: string,
  timestamp: string,
  ruleSections: string
): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:12px;padding:32px;color:#0f172a;">
      <h2 style="margin:0 0 4px 0;font-size:20px;color:#dc2626;">Threshold Alert</h2>
      <p style="color:#64748b;margin:0 0 4px 0;font-size:14px;">${deviceName}</p>
      <p style="color:#94a3b8;margin:0 0 24px 0;font-size:12px;">${timestamp}</p>
      ${ruleSections}
      <p style="margin-top:8px;font-size:12px;color:#94a3b8;">
        This alert was generated automatically. 
        Manage alert rules in the dashboard.
      </p>
    </div>`;
}
