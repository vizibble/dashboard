import transporter from '@/utils/nodemailer.js';

interface AlertMailOptions {
  to: string;
  deviceName: string;
  parameter: string;
  condition: string;
  threshold: number;
  actualValue: string;
  label?: string | null;
  firedAt: Date;
}

const CONDITION_TEXT: Record<string, string> = {
  gt: 'greater than',
  gte: 'greater than or equal to',
  lt: 'less than',
  lte: 'less than or equal to',
  eq: 'equal to',
};

export async function sendAlertEmail(opts: AlertMailOptions): Promise<void> {
  const conditionText = CONDITION_TEXT[opts.condition] ?? opts.condition;
  const subject = opts.label
    ? `⚠️ Alert: ${opts.label}`
    : `⚠️ Alert: ${opts.parameter} threshold crossed on ${opts.deviceName}`;

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; padding: 32px; color: #0f172a;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #dc2626;">⚠️ Sensor Alert Triggered</h2>
      <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px;">${opts.firedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>

      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.07);">
        <tbody>
          ${row('Device', opts.deviceName)}
          ${row('Parameter', opts.parameter)}
          ${row('Rule', `${opts.parameter} ${conditionText} ${opts.threshold}`)}
          ${row('Measured Value', `<strong>${opts.actualValue}</strong>`)}
          ${opts.label ? row('Label', opts.label) : ''}
        </tbody>
      </table>

      <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
        This alert was generated automatically by Toppan. You can manage your alert rules in the dashboard.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Toppan Alerts" <${process.env['SMTP_USER']}>`,
    to: opts.to,
    subject,
    html,
  });
}

function row(label: string, value: string): string {
  return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 500; width: 40%;">${label}</td>
      <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">${value}</td>
    </tr>`;
}
