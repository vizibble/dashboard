import 'dotenv/config';
import pool from '../service/dbConnection.js';
import transporter from '../service/nodemailer.js';
import { formatParamLabel } from '../utils/formatParam.js';

interface Device {
  device_id: string;
  name: string;
  type: string;
  location: string | null;
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
  payload: Record<string, unknown>;
  hour: number;
  recorded_at: Date;
}

interface AggregatedStats {
  mean: number;
  min: number;
  max: number;
  count: number;
}

const TARGET_USER_ID = process.env.TARGET_USER_ID;
const TIME_ZONE = 'Asia/Kolkata';

const BRAND = {
  navy: '#14243A',
  blue: '#278FC1',
  blueLight: '#EAF5FB',
  page: '#F2F6F9',
  surface: '#FFFFFF',
  border: '#DCE5EC',
  text: '#172B3A',
  muted: '#647789',
  green: '#16845B',
  greenLight: '#EAF6F0',
  red: '#C43D4B',
  redLight: '#FCEEEF',
};

const PARAM_UNITS: Record<string, string> = {
  temperature: ' °C',
  temp: ' °C',
  humidity: ' %RH',
  humid: ' %RH',
  differentialpressure: ' Pa',
  pressure: ' Pa',
  flowrate: ' L/min',
  flow: ' L/min',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });
}

function normalizeParam(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

function getUnit(key: string): string {
  const normalized = normalizeParam(key);

  for (const [name, unit] of Object.entries(PARAM_UNITS)) {
    if (normalized.includes(normalizeParam(name))) return unit;
  }

  return '';
}

function parametersMatch(param1: string, param2: string): boolean {
  const p1 = normalizeParam(param1);
  const p2 = normalizeParam(param2);

  if (p1 === p2) return true;

  const aliases: Record<string, string[]> = {
    temperature: ['temp', 't'],
    humidity: ['humid', 'rh', 'h'],
    differentialpressure: ['dp', 'diffpress', 'diffp'],
  };

  for (const [canonical, names] of Object.entries(aliases)) {
    const group = [canonical, ...names];
    if (group.includes(p1) && group.includes(p2)) return true;
  }

  return false;
}

function isOutOfRange(value: number, rules: AlertRule[]): boolean {
  return rules.some((rule) => {
    switch (rule.condition) {
      case 'lt': return value < rule.threshold;
      case 'lte': return value <= rule.threshold;
      case 'gt': return value > rule.threshold;
      case 'gte': return value >= rule.threshold;
      default: return false;
    }
  });
}

function getSpecifications(rules: AlertRule[]): string {
  if (rules.length === 0) return 'No limits configured';

  const lowRule = rules.find(
    (rule) => rule.condition === 'lt' || rule.condition === 'lte'
  );

  const highRule = rules.find(
    (rule) => rule.condition === 'gt' || rule.condition === 'gte'
  );

  const low = lowRule
    ? `${lowRule.condition === 'lt' ? '≥' : '>'} ${lowRule.threshold}`
    : null;

  const high = highRule
    ? `${highRule.condition === 'gt' ? '≤' : '<'} ${highRule.threshold}`
    : null;

  if (low && high) return `${low} and ${high}`;
  if (low) return low;
  if (high) return high;

  const rule = rules[0]!;

  const symbol: Record<string, string> = {
    lt: '≥',
    lte: '>',
    gt: '≤',
    gte: '<',
  };

  return `${symbol[rule.condition] ?? ''} ${rule.threshold}`.trim();
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getYesterdayRange(): {
  start: string;
  end: string;
  date: Date;
} {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;

  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const todayUtc = new Date(`${today}T00:00:00.000Z`);
  const yesterdayUtc = new Date(todayUtc.getTime() - 86400000);
  const yesterday = yesterdayUtc.toISOString().slice(0, 10);

  return {
    start: `${yesterday} 00:00:00`,
    end: `${today} 00:00:00`,
    date: new Date(`${yesterday}T12:00:00.000Z`),
  };
}

function generateQuickChartUrl(
  parameterName: string,
  hourlyMeans: Record<number, number>,
  rules: AlertRule[],
  unit: string
): string {
  const labels = Array.from({ length: 24 }, (_, hour) =>
    `${String(hour).padStart(2, '0')}:00`
  );

  const values = Array.from({ length: 24 }, (_, hour) =>
    hourlyMeans[hour] !== undefined ? hourlyMeans[hour] : null
  );

  const datasets: Array<Record<string, unknown>> = [
    {
      label: formatParamLabel(parameterName),
      data: values,
      borderColor: BRAND.blue,
      backgroundColor: 'rgba(39, 143, 193, 0.13)',
      fill: true,
      borderWidth: 2.5,
      pointRadius: 2,
      pointHoverRadius: 3,
      pointBackgroundColor: BRAND.blue,
      pointBorderColor: '#FFFFFF',
      spanGaps: false,
      lineTension: 0.25,
    },
  ];

  for (const rule of rules) {
    datasets.push({
      label: `${rule.label || 'Limit'}: ${rule.threshold}${unit}`,
      data: Array(24).fill(rule.threshold),
      borderColor: BRAND.red,
      borderWidth: 1.5,
      borderDash: [5, 4],
      fill: false,
      pointRadius: 0,
      pointHitRadius: 0,
      lineTension: 0,
    });
  }

  const config = {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      legend: {
        display: rules.length > 0,
        position: 'bottom',
        labels: {
          fontFamily: 'Arial',
          fontSize: 10,
          fontColor: '#526779',
          boxWidth: 18,
          padding: 14,
        },
      },
      tooltips: { enabled: false },
      scales: {
        xAxes: [{
          gridLines: { display: false, drawBorder: false },
          ticks: {
            fontFamily: 'Arial',
            fontSize: 9,
            fontColor: '#718496',
            maxTicksLimit: 6,
            maxRotation: 0,
            minRotation: 0,
          },
        }],
        yAxes: [{
          gridLines: {
            color: '#E8EEF3',
            drawBorder: false,
          },
          ticks: {
            fontFamily: 'Arial',
            fontSize: 9,
            fontColor: '#718496',
            maxTicksLimit: 5,
          },
          scaleLabel: {
            display: Boolean(unit),
            labelString: unit.trim(),
            fontFamily: 'Arial',
            fontSize: 9,
            fontColor: '#718496',
          },
        }],
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));

  return `https://quickchart.io/chart?width=640&height=250&devicePixelRatio=2&format=png&backgroundColor=white&c=${encoded}`;
}

function buildMetric(
  label: string,
  value: string,
  unit: string,
  background: string,
  valueColor = BRAND.text
): string {
  return `
    <td class="metric-cell" width="33.33%" valign="top"
      style="width:33.33%;padding:13px 12px;background:${background};border:1px solid ${BRAND.border};">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:${BRAND.muted};">
        ${escapeHtml(label)}
      </div>
      <div style="padding-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:26px;font-weight:700;color:${valueColor};word-break:break-word;">
        ${escapeHtml(value)}<span style="font-size:11px;line-height:16px;font-weight:600;color:${BRAND.muted};">${escapeHtml(unit)}</span>
      </div>
    </td>`;
}

function buildEmail(
  devices: Device[],
  alertRules: AlertRule[],
  groupedData: Record<string, Record<string, Record<number, number[]>>>,
  statsData: Record<string, Record<string, Record<number, AggregatedStats>>>,
  readingsCount: number,
  reportDate: Date
): string {
  const reportingDevices = devices.filter((device) =>
    Boolean(
      statsData[device.device_id] &&
      Object.keys(statsData[device.device_id]!).length
    )
  );

  let parameterCount = 0;
  let breachedCount = 0;

  for (const device of reportingDevices) {
    for (const [paramKey] of Object.entries(statsData[device.device_id]!)) {
      parameterCount++;

      const rules = alertRules.filter((rule) =>
        rule.device_id === device.device_id &&
        parametersMatch(rule.parameter, paramKey)
      );

      const values = Object.values(
        groupedData[device.device_id]?.[paramKey] ?? {}
      ).flat();

      if (values.some((value) => isOutOfRange(value, rules))) {
        breachedCount++;
      }
    }
  }

  const normalCount = parameterCount - breachedCount;
  const dateLabel = formatDate(reportDate);
  const periodLabel = `${dateLabel} · 00:00–23:59 IST`;

  let content = '';

  if (reportingDevices.length === 0) {
    content = `
      <tr>
        <td style="padding:30px 26px 34px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:24px;font-weight:700;color:${BRAND.text};">
            No sensor data received
          </div>
          <div style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:${BRAND.muted};">
            No readings were recorded for the reporting period. Check device connectivity and data ingestion.
          </div>
        </td>
      </tr>`;
  } else {
    for (const device of reportingDevices) {
      const devStats = statsData[device.device_id]!;
      const deviceName = escapeHtml(device.name || 'Unnamed device');
      const location = escapeHtml(device.location || 'Location not set');
      const deviceType = escapeHtml(device.type || 'Device');

      content += `
        <tr>
          <td style="padding:26px 26px 10px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:23px;font-weight:700;color:${BRAND.text};">
              ${deviceName}
            </div>
            <div style="padding-top:5px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
              ${location}
            </div>
            <div style="padding-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:.3px;color:#8495A4;">
              ${deviceType} &nbsp;·&nbsp; ${escapeHtml(device.device_id)}
            </div>
            <div style="height:1px;line-height:1px;background:${BRAND.border};margin-top:15px;">&nbsp;</div>
          </td>
        </tr>`;

      for (const [paramKey, paramData] of Object.entries(devStats)) {
        const rules = alertRules.filter((rule) =>
          rule.device_id === device.device_id &&
          parametersMatch(rule.parameter, paramKey)
        );

        const allValues = Object.values(
          groupedData[device.device_id]?.[paramKey] ?? {}
        ).flat();

        if (allValues.length === 0) continue;

        const sum = allValues.reduce((total, value) => total + value, 0);
        const average = sum / allValues.length;
        const minimum = Math.min(...allValues);
        const maximum = Math.max(...allValues);
        const breachCount = allValues.filter(
          (value) => isOutOfRange(value, rules)
        ).length;

        const flagged = breachCount > 0;
        const statusColor = flagged ? BRAND.red : BRAND.green;
        const statusBg = flagged ? BRAND.redLight : BRAND.greenLight;
        const statusLabel = flagged ? 'LIMIT BREACH' : 'WITHIN LIMITS';
        const unit = getUnit(paramKey);
        const label = escapeHtml(formatParamLabel(paramKey));
        const spec = getSpecifications(rules);

        const hourlyMeans: Record<number, number> = {};

        for (const [hour, stats] of Object.entries(paramData)) {
          hourlyMeans[Number(hour)] = stats.mean;
        }

        const chartUrl = generateQuickChartUrl(
          paramKey,
          hourlyMeans,
          rules,
          unit
        );

        const exceptionText = flagged
          ? `<div style="margin-top:12px;padding:11px 13px;background:${BRAND.redLight};border-left:3px solid ${BRAND.red};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#842D37;">
               <strong>${breachCount.toLocaleString('en-IN')} of ${allValues.length.toLocaleString('en-IN')} samples</strong> crossed the configured limit during this reporting period.
             </div>`
          : '';

        content += `
          <tr>
            <td style="padding:8px 26px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="width:100%;border:1px solid ${BRAND.border};border-top:3px solid ${statusColor};background:${BRAND.surface};">
                <tr>
                  <td style="padding:15px 16px 13px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;letter-spacing:.2px;color:${BRAND.text};">
                          ${label}
                        </td>
                        <td align="right" valign="middle" style="padding-left:8px;">
                          <span style="display:inline-block;padding:5px 8px;background:${statusBg};font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:12px;font-weight:700;letter-spacing:.5px;color:${statusColor};">
                            ${statusLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="metrics">
                      <tr>
                        ${buildMetric('Average', formatNumber(average), unit, BRAND.blueLight)}
                        ${buildMetric('Minimum – Maximum', `${formatNumber(minimum)} – ${formatNumber(maximum)}`, unit, '#F5F8FA')}
                        ${buildMetric('Configured limits', spec, '', flagged ? BRAND.redLight : '#F5F8FA', flagged ? BRAND.red : BRAND.text)}
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:13px 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:${BRAND.muted};">
                    ${allValues.length.toLocaleString('en-IN')} samples recorded
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 12px 4px;">
                    <img src="${chartUrl}" width="640" height="250" alt="${label} hourly average chart. Blue line shows readings; red dashed lines show configured limits."
                      style="display:block;width:100%;max-width:640px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px 15px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#8495A4;">
                      Hourly averages · Local time (IST)
                    </div>
                    ${exceptionText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Daily Performance Report</title>
  <style type="text/css">
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; }
    @media only screen and (max-width:600px) {
      .outer-pad { padding:12px 8px !important; }
      .main-pad { padding-left:16px !important; padding-right:16px !important; }
      .header-pad { padding:22px 18px !important; }
      .metric-cell { display:block !important; width:auto !important; }
      .metric-cell + .metric-cell { border-top:0 !important; }
      .summary-cell { display:block !important; width:auto !important; border-right:0 !important; border-bottom:1px solid ${BRAND.border} !important; }
      .summary-cell:last-child { border-bottom:0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="width:100%;background:${BRAND.page};">
    <tr>
      <td align="center" class="outer-pad" style="padding:28px 12px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:${BRAND.surface};border:1px solid ${BRAND.border};">
          <tr>
            <td class="header-pad" bgcolor="${BRAND.navy}" style="padding:25px 26px 22px;background:${BRAND.navy};border-bottom:4px solid ${BRAND.blue};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1.5px;color:#9BD8F0;">
                VIZIBBLE SYSTEMS
              </div>
              <div style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:23px;line-height:30px;font-weight:700;color:#FFFFFF;">
                Daily Performance Report
              </div>
              <div style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#C5D2DE;">
                ${escapeHtml(periodLabel)}
              </div>
            </td>
          </tr>
          <tr>
            <td class="main-pad" style="padding:20px 26px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid ${BRAND.border};background:#F8FAFC;">
                <tr>
                  <td class="summary-cell" width="25%" style="width:25%;padding:13px 10px;border-right:1px solid ${BRAND.border};">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;color:${BRAND.muted};">REPORTING DEVICES</div>
                    <div style="padding-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:27px;font-weight:700;color:${BRAND.text};">${reportingDevices.length}</div>
                  </td>
                  <td class="summary-cell" width="25%" style="width:25%;padding:13px 10px;border-right:1px solid ${BRAND.border};">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;color:${BRAND.muted};">PARAMETERS</div>
                    <div style="padding-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:27px;font-weight:700;color:${BRAND.text};">${parameterCount}</div>
                  </td>
                  <td class="summary-cell" width="25%" style="width:25%;padding:13px 10px;border-right:1px solid ${BRAND.border};">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;color:${BRAND.muted};">WITHIN LIMITS</div>
                    <div style="padding-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:27px;font-weight:700;color:${BRAND.green};">${normalCount}</div>
                  </td>
                  <td class="summary-cell" width="25%" style="width:25%;padding:13px 10px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;color:${BRAND.muted};">LIMIT BREACHES</div>
                    <div style="padding-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:27px;font-weight:700;color:${breachedCount ? BRAND.red : BRAND.green};">${breachedCount}</div>
                  </td>
                </tr>
              </table>
              <div style="padding-top:9px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#8495A4;">
                ${readingsCount.toLocaleString('en-IN')} sensor records received during the reporting period
              </div>
            </td>
          </tr>
          <tr>
            <td class="main-pad" style="padding:14px 26px 8px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.blue};">
                Device performance
              </div>
            </td>
          </tr>
          ${content}
          <tr>
            <td style="padding:20px 26px;background:#F5F8FA;border-top:1px solid ${BRAND.border};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:${BRAND.muted};">
                This is an automated monitoring report from Vizibble Systems.
              </div>
              <div style="padding-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#8A9AA8;">
                Reporting timezone: Asia/Kolkata (IST)
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main(): Promise<void> {
  if (!TARGET_USER_ID) {
    throw new Error('TARGET_USER_ID is not configured.');
  }

  console.log(`[Daily Report] Starting report for user: ${TARGET_USER_ID}`);

  try {
    const emailResult = await pool.query<{ email: string }>(
      `SELECT email
       FROM user_alert_emails
       WHERE user_id = $1
       ORDER BY email`,
      [TARGET_USER_ID]
    );

    const recipientEmails = emailResult.rows
      .map((row) => row.email?.trim())
      .filter((email): email is string => Boolean(email));

    if (recipientEmails.length === 0) {
      console.log('[Daily Report] No recipient emails configured. Exiting.');
      return;
    }

    const deviceResult = await pool.query<Device>(
      `SELECT
         d.device_id,
         d.name,
         d.type,
         d.location
       FROM devices d
       WHERE d.user_id = $1
       ORDER BY d.name`,
      [TARGET_USER_ID]
    );

    const devices = deviceResult.rows;

    if (devices.length === 0) {
      console.log('[Daily Report] No devices found. Exiting.');
      return;
    }

    const ruleResult = await pool.query<AlertRule>(
      `SELECT device_id, parameter, condition, threshold, label
       FROM alert_rules
       WHERE device_id IN (
         SELECT device_id FROM devices WHERE user_id = $1
       )
         AND enabled = TRUE
       ORDER BY device_id, parameter, threshold ASC`,
      [TARGET_USER_ID]
    );

    const alertRules = ruleResult.rows;
    const range = getYesterdayRange();

    const readingsResult = await pool.query<SensorReadingRow>(
      `SELECT
         device_id,
         payload,
         EXTRACT(HOUR FROM recorded_at AT TIME ZONE $2)::int AS hour,
         recorded_at
       FROM sensor_readings
       WHERE device_id IN (
         SELECT device_id FROM devices WHERE user_id = $1
       )
         AND recorded_at >= ($3::date::timestamp AT TIME ZONE $2)
         AND recorded_at < ($4::date::timestamp AT TIME ZONE $2)
       ORDER BY recorded_at ASC`,
      [
        TARGET_USER_ID,
        TIME_ZONE,
        range.start.slice(0, 10),
        range.end.slice(0, 10),
      ]
    );

    const readings = readingsResult.rows;

    const groupedData: Record<
      string,
      Record<string, Record<number, number[]>>
    > = {};

    for (const reading of readings) {
      if (!reading.payload || typeof reading.payload !== 'object') continue;

      const deviceGroup = (groupedData[reading.device_id] ??= {});

      for (const [key, rawValue] of Object.entries(reading.payload)) {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          continue;
        }

        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;

        const parameterGroup = (deviceGroup[key] ??= {});
        const hourValues = (parameterGroup[reading.hour] ??= []);

        hourValues.push(value);
      }
    }

    const statsData: Record<
      string,
      Record<string, Record<number, AggregatedStats>>
    > = {};

    for (const [deviceId, deviceData] of Object.entries(groupedData)) {
      const deviceStats = (statsData[deviceId] ??= {});

      for (const [parameter, parameterData] of Object.entries(deviceData)) {
        const parameterStats = (deviceStats[parameter] ??= {});

        for (const [hourText, values] of Object.entries(parameterData)) {
          if (values.length === 0) continue;

          const hour = Number(hourText);
          const sum = values.reduce((total, value) => total + value, 0);

          parameterStats[hour] = {
            mean: Number((sum / values.length).toFixed(2)),
            min: Number(Math.min(...values).toFixed(2)),
            max: Number(Math.max(...values).toFixed(2)),
            count: values.length,
          };
        }
      }
    }

    const emailHtml = buildEmail(
      devices,
      alertRules,
      groupedData,
      statsData,
      readings.length,
      range.date
    );

    await Bun.write('test_report_preview.html', emailHtml);

    console.log(
      '[Daily Report] Preview saved to test_report_preview.html'
    );

    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;

    if (
      process.env.SEND_EMAIL === 'true' ||
      process.env.NODE_ENV === 'production'
    ) {
      await transporter.sendMail({
        from: `"Vizibble Reports" <${smtpUser}>`,
        to: recipientEmails.join(', '),
        subject: `Daily Performance Report - ${formatDate(range.date)}`,
        html: emailHtml,
      });

      console.log(
        `[Daily Report] Sent to ${recipientEmails.length} recipient(s).`
      );
    } else {
      console.log(
        '[Daily Report] Sending skipped. Set SEND_EMAIL=true to send.'
      );
    }
  } catch (error) {
    console.error('[Daily Report] Failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
