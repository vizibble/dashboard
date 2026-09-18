import 'dotenv/config';
import pool from '../service/dbConnection.js';
import transporter from '../service/nodemailer.js';
import { formatParamLabel } from '../utils/formatParam.js';

interface Device {
  device_id: string;
  name: string;
  type: string;
}

interface AlertRule {
  device_id: string;
  parameter: string;
  condition: string;
  threshold: number;
  label: string | null;
}

interface SensorReadingRow {
  device_id: string;
  payload: Record<string, any>;
  hour: number;
  recorded_at: Date;
}

interface AggregatedStats {
  mean: number;
  min: number;
  max: number;
  count: number;
}

const TARGET_USER_ID = process.env.TARGET_USER_ID!;

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

const PARAM_UNITS: Record<string, string> = {
  temperature: ' °C',
  temp: ' °C',
  humidity: ' %RH',
  humid: ' %RH',
  differential_pressure: ' Pa',
  pressure: ' Pa',
  flow_rate: ' L/min',
  flow: ' L/min',
};

function getUnit(key: string): string {
  const normalized = key.toLowerCase().replace(/[\s_-]+/g, '');
  for (const [k, unit] of Object.entries(PARAM_UNITS)) {
    if (normalized.includes(k.replace(/[\s_-]+/g, ''))) {
      return unit;
    }
  }
  return '';
}

function getSpecifications(rules: AlertRule[]): string {
  if (rules.length === 0) return 'No limit';

  const lowRule = rules.find(
    (r) => r.condition === 'lt' || r.condition === 'lte'
  );
  const highRule = rules.find(
    (r) => r.condition === 'gt' || r.condition === 'gte'
  );

  if (lowRule && highRule) {
    return `${lowRule.threshold} - ${highRule.threshold}`;
  } else if (lowRule) {
    const symbol = lowRule.condition === 'lt' ? '>' : '>=';
    return `${symbol}${lowRule.threshold}`;
  } else if (highRule) {
    const symbol = highRule.condition === 'gt' ? '<' : '<=';
    return `${symbol}${highRule.threshold}`;
  }

  const r = rules[0]!;
  const sym =
    r.condition === 'gt' ? '<' : r.condition === 'lt' ? '>' : r.condition;
  return `${sym}${r.threshold}`;
}

function parametersMatch(param1: string, param2: string): boolean {
  const p1 = param1.toLowerCase().replace(/[\s_-]+/g, '');
  const p2 = param2.toLowerCase().replace(/[\s_-]+/g, '');
  if (p1 === p2) return true;

  const aliases: Record<string, string[]> = {
    temperature: ['temp', 't'],
    humidity: ['humid', 'rh', 'h'],
    differentialpressure: [
      'dp',
      'diffpress',
      'differential_pressure',
      'diff_press',
    ],
  };

  for (const [key, list] of Object.entries(aliases)) {
    if (p1 === key && list.includes(p2)) return true;
    if (p2 === key && list.includes(p1)) return true;
  }

  return false;
}

async function main() {
  console.log(
    `[Daily Report] Starting daily report for user: ${TARGET_USER_ID}`
  );

  try {
    // 1. Fetch user emails
    const emailResult = await pool.query<{ email: string }>(
      'SELECT email FROM user_alert_emails WHERE user_id = $1',
      [TARGET_USER_ID]
    );
    const recipientEmails = emailResult.rows.map((r) => r.email);

    if (recipientEmails.length === 0) {
      console.log(
        `[Daily Report] No alert emails registered for user ${TARGET_USER_ID}. Exiting.`
      );
      return;
    }
    console.log(`[Daily Report] Recipients: ${recipientEmails.join(', ')}`);

    // 2. Fetch devices
    const deviceResult = await pool.query<Device>(
      'SELECT device_id, name, type FROM devices WHERE user_id = $1',
      [TARGET_USER_ID]
    );
    const devices = deviceResult.rows;
    if (devices.length === 0) {
      console.log(
        `[Daily Report] No devices found for user ${TARGET_USER_ID}. Exiting.`
      );
      return;
    }
    console.log(`[Daily Report] Found ${devices.length} devices.`);

    // 3. Fetch alert rules.
    // ORDER BY added: previously rules for the same device/parameter had no
    // deterministic order, so "the first rule" picked further down could
    // silently change between runs. Tightest threshold first is the most
    // useful default for a single-line chart.
    const ruleResult = await pool.query<AlertRule>(
      `SELECT device_id, parameter, condition, threshold, label
       FROM alert_rules
       WHERE device_id IN (SELECT device_id FROM devices WHERE user_id = $1)
         AND enabled = TRUE
       ORDER BY device_id, parameter, threshold ASC`,
      [TARGET_USER_ID]
    );
    const alertRules = ruleResult.rows;

    // 4. Fetch sensor readings for the previous day (12 AM to 12 AM IST)
    const readingsResult = await pool.query<SensorReadingRow>(
      `SELECT device_id, payload, 
              EXTRACT(HOUR FROM recorded_at AT TIME ZONE 'Asia/Kolkata')::int AS hour,
              recorded_at
       FROM sensor_readings
       WHERE device_id IN (SELECT device_id FROM devices WHERE user_id = $1)
         AND recorded_at >= (timezone('Asia/Kolkata', now())::date - 1)::timestamp AT TIME ZONE 'Asia/Kolkata'
         AND recorded_at < (timezone('Asia/Kolkata', now())::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
       ORDER BY recorded_at ASC`,
      [TARGET_USER_ID]
    );
    const readings = readingsResult.rows;
    console.log(
      `[Daily Report] Fetched ${readings.length} readings for the previous day.`
    );

    // 5. Aggregate stats in TypeScript
    // Structure: deviceId -> parameterName -> hour (0-23) -> values[]
    const groupedData: Record<
      string,
      Record<string, Record<number, number[]>>
    > = {};

    for (const r of readings) {
      const devGroup = (groupedData[r.device_id] ??= {});
      for (const [key, val] of Object.entries(r.payload)) {
        const numVal = Number(val);
        if (isNaN(numVal)) continue;

        const paramGroup = (devGroup[key] ??= {});
        const hourVals = (paramGroup[r.hour] ??= []);
        hourVals.push(numVal);
      }
    }

    // Now calculate hourly mean, min, max
    // Structure: deviceId -> parameterName -> hour (0-23) -> AggregatedStats
    const statsData: Record<
      string,
      Record<string, Record<number, AggregatedStats>>
    > = {};

    for (const [deviceId, devData] of Object.entries(groupedData)) {
      const devStats = (statsData[deviceId] ??= {});
      for (const [param, paramData] of Object.entries(devData)) {
        const paramStats = (devStats[param] ??= {});
        for (const [hourStr, vals] of Object.entries(paramData)) {
          const hour = Number(hourStr);
          if (vals.length === 0) continue;
          const sum = vals.reduce((a, b) => a + b, 0);
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          paramStats[hour] = {
            mean: Number((sum / vals.length).toFixed(2)),
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2)),
            count: vals.length,
          };
        }
      }
    }

    // Yesterday's date string formatted for Asia/Kolkata
    const yesterdayDateStr = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // 6. Build the email HTML.
    // Theme: modern slate/dark header with blue accent bar matching Cosmo style
    let emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Daily Performance Report</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #e2e8f0;">
        <!-- HEADER -->
        <tr>
          <td style="background:#0f172a;padding:26px 28px;border-bottom:4px solid #2563eb;">
            <div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">
              VIZIBBLE SYSTEMS
            </div>
            <div style="font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">
              Daily Performance Report
            </div>
            <div style="margin-top:14px;font-size:12px;line-height:18px;color:#94a3b8;">
              ${escapeHtml(yesterdayDateStr)}
            </div>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:24px 28px;">
    `;
    for (const device of devices) {
      const devStats = statsData[device.device_id];
      if (!devStats || Object.keys(devStats).length === 0) {
        continue;
      }
      const deviceName = escapeHtml(device.name);

      emailHtml += `
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 16px; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em;">
          ${deviceName}
        </div>
      `;

      for (const [paramKey, paramData] of Object.entries(devStats)) {
        const rules = alertRules.filter(
          (rule) =>
            rule.device_id === device.device_id &&
            parametersMatch(rule.parameter, paramKey)
        );
        const rule = rules[0] || null;

        const hourlyMeans: Record<number, number> = {};
        for (const [hour, stats] of Object.entries(paramData)) {
          hourlyMeans[Number(hour)] = stats.mean;
        }

        const paramLabel = escapeHtml(formatParamLabel(paramKey));

        // Calculate Overall daily statistics
        const allVals = Object.values(
          groupedData[device.device_id]?.[paramKey] || {}
        ).flat();
        const overallSum = allVals.reduce((a, b) => a + b, 0);
        const overallCount = allVals.length;
        const overallAvg =
          overallCount > 0 ? (overallSum / overallCount).toFixed(2) : '0.00';
        const hourlyAverages = Object.values(paramData).map(
          (stats) => stats.mean
        );
        const overallMin =
          hourlyAverages.length > 0
            ? Math.min(...hourlyAverages).toFixed(2)
            : '0.00';
        const overallMax =
          hourlyAverages.length > 0
            ? Math.max(...hourlyAverages).toFixed(2)
            : '0.00';
        const unit = getUnit(paramKey);
        const specs = getSpecifications(rules);

        // Generate QuickChart URL
        const chartUrl = generateQuickChartUrl(paramKey, hourlyMeans, rules);

        emailHtml += `
          <div style="margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.02em;">
              ${paramLabel}
            </div>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <tr>
                <td width="33%" style="padding: 10px 12px; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Average</div>
                  <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${overallAvg}${unit}</div>
                </td>
                <td width="33%" style="padding: 10px 12px; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Min - Max</div>
                  <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${overallMin} - ${overallMax}${unit}</div>
                </td>
                <td width="34%" style="padding: 10px 12px;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Specifications</div>
                  <div style="font-size: 15px; font-weight: 700; color: #2563eb; margin-top: 2px;">${specs}${unit}</div>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; background: #ffffff; border-radius: 6px;">
              <tr>
                <td style="padding: 12px;">
                  <img src="${chartUrl}" width="600" style="display: block; width: 100%; height: auto; max-width: 600px; border: 0;" alt="${paramLabel} Chart" />
                </td>
              </tr>
            </table>
          </div>
        `;
      }
    }

    emailHtml += `
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

    // 7. Save preview file locally
    await Bun.write('test_report_preview.html', emailHtml);
    console.log(
      '[Daily Report] HTML preview saved to backend/test_report_preview.html'
    );

    const smtpUser = process.env['SMTP_USER'] || process.env['GMAIL_USER'];

    if (
      process.env['SEND_EMAIL'] === 'true' ||
      process.env['NODE_ENV'] === 'production'
    ) {
      await transporter.sendMail({
        from: `"Vizibble Reports" <${smtpUser}>`,
        to: recipientEmails.join(', '),
        subject: `Daily Performance Report — ${yesterdayDateStr}`,
        html: emailHtml,
      });
      console.log(
        `[Daily Report] Daily report successfully emailed to ${recipientEmails.length} recipients.`
      );
    } else {
      console.log(
        '[Daily Report] Local environment detected: skipping email sending. Set SEND_EMAIL=true in .env to force send.'
      );
    }
  } catch (error) {
    console.error('[Daily Report] Error executing daily report script:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function generateQuickChartUrl(
  parameterName: string,
  hourlyMeans: { [hour: number]: number },
  rules: AlertRule[]
): string {
  const labels = Array.from(
    { length: 24 },
    (_, h) => `${String(h).padStart(2, '0')}:00`
  );

  const data = Array.from({ length: 24 }, (_, h) => {
    const val = hourlyMeans[h];
    return val !== undefined ? val : null;
  });

  const datasets: any[] = [
    {
      label: formatParamLabel(parameterName),
      data: data,
      borderColor: '#1e40af',
      backgroundColor: 'rgba(30, 64, 175, 0.12)',
      fill: true,
      borderWidth: 2,
      pointRadius: 2.5,
      pointBackgroundColor: '#1e40af',
      pointBorderColor: '#ffffff',
      spanGaps: true,
    },
  ];

  for (const rule of rules) {
    const conditionText = rule.condition
      ? ` (${rule.condition.toUpperCase()})`
      : '';
    datasets.push({
      label: `Limit: ${rule.threshold}${conditionText}`,
      data: Array(24).fill(rule.threshold),
      borderColor: '#dc2626',
      borderWidth: 1.5,
      borderDash: [4, 4],
      fill: false,
      pointRadius: 0,
      pointHitRadius: 0,
    });
  }

  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      legend: {
        display: rules.length > 0,
        position: 'top',
        labels: {
          fontSize: 10,
          boxWidth: 20,
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              color: '#e8edf3',
            },
            ticks: {
              fontSize: 9,
              fontColor: '#94a3b8',
              maxTicksLimit: 6,
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: '#e8edf3',
            },
            ticks: {
              fontSize: 9,
              fontColor: '#94a3b8',
            },
          },
        ],
      },
    },
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?w=600&h=180&c=${encodedConfig}`;
}

main();
