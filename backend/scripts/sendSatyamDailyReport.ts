import 'dotenv/config';
import pool from '../service/dbConnection.js';
import transporter from '../service/nodemailer.js';

// Conversion factor: raw length units → kilograms
const LENGTH_TO_KG = 0.015272727272727;

interface SensorReadingRow {
  payload: Record<string, unknown>;
  recorded_at: Date;
}

interface ShiftStats {
  name: string;
  production: number; // kg
  activeMin: number;
  idleMin: number;
  offlineMin: number;
  stops: number;
}

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

/**
 * Returns the reporting window: Previous 08:00 IST → Current 08:00 IST
 * The returned Date objects represent UTC timestamps.
 */
function getISTBoundaryTimestamps(): {
  startTime: Date;
  endTime: Date;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((item) => item.type === type);
    if (!part)
      throw new Error(`Unable to determine "${type}" from IST date formatter.`);
    const value = Number(part.value);
    if (!Number.isFinite(value))
      throw new Error(`Invalid "${type}" value: ${part.value}`);
    return value;
  };
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const currentActualUTC = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET_MS
  );
  // Boundary is 08:00 IST (production_count, not 08:30 like count devices)
  let endTime = new Date(
    Date.UTC(year, month - 1, day, 8, 0, 0, 0) - IST_OFFSET_MS
  );
  if (currentActualUTC.getTime() < endTime.getTime()) {
    endTime = new Date(endTime.getTime() - DAY_MS);
  }
  return { startTime: new Date(endTime.getTime() - DAY_MS), endTime };
}

function getISTTime(date: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((part) => part.type === 'hour');
  const minutePart = parts.find((part) => part.type === 'minute');
  if (!hourPart || !minutePart) {
    throw new Error(`Unable to determine IST time for ${date.toISOString()}`);
  }
  const hour = Number(hourPart.value);
  const minute = Number(minutePart.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Invalid IST time for ${date.toISOString()}`);
  }
  return { hour, minute };
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours === 0
    ? `${mins} min`
    : mins === 0
      ? `${hours} hr`
      : `${hours} hr ${mins} min`;
}

function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatReportTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

async function main(): Promise<void> {
  try {
    // Get device ID
    const deviceId = process.env.SATYAM_DEVICE_ID;
    if (!deviceId) {
      throw new Error('No satyam_count device found. SetSATYAM_DEVICE_ID.');
    }
    console.log(`[Daily Report] Device: ${deviceId}`);

    // Get device owner and alert recipients
    const ownerResult = await pool.query<{
      deviceName: string;
      alertEmails: string[];
    }>(
      `
  SELECT
    d.name AS "deviceName",
    COALESCE(
      array_agg(uae.email) FILTER (WHERE uae.email IS NOT NULL),
      '{}'
    ) AS "alertEmails"
  FROM devices d
  JOIN users u ON d.user_id = u.user_id
  LEFT JOIN user_alert_emails uae ON u.user_id = uae.user_id
  WHERE d.device_id = $1
  GROUP BY d.name
  LIMIT 1
  `,
      [deviceId]
    );
    const ownerInfo = ownerResult.rows[0];
    if (!ownerInfo) {
      throw new Error(`Device ${deviceId} not found.`);
    }

    // Collect recipients
    const recipientEmails = (ownerInfo.alertEmails ?? []).filter(
      (email): email is string =>
        typeof email === 'string' && email.trim().length > 0
    );
    if (recipientEmails.length === 0) {
      console.log('[Daily Report] No recipients found. Exiting.');
      return;
    }

    // Get reporting window (08:00 IST boundary)
    const { startTime, endTime } = getISTBoundaryTimestamps();
    const reportDateStr = formatReportDate(startTime);
    const startTimeStr = formatReportTime(startTime);
    const endTimeStr = formatReportTime(endTime);

    // Build deep-link to the records page for this device + date
    const frontendUrl = (
      process.env.WEBSITE_URL ?? 'http://localhost:5173'
    ).replace(/\/$/, '');
    const reportDateYmd = (() => {
      const d = startTime;
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d); // returns YYYY-MM-DD
    })();
    const recordsUrl = `${frontendUrl}/#/records?device=${encodeURIComponent(deviceId)}&date=${reportDateYmd}`;

    // Fetch readings
    const readingsResult = await pool.query<SensorReadingRow>(
      `
      SELECT payload, recorded_at FROM sensor_readings
      WHERE device_id = $1 AND recorded_at >= $2 AND recorded_at < $3
      ORDER BY recorded_at ASC
      `,
      [deviceId, startTime, endTime]
    );
    const readings = readingsResult.rows;
    console.log(`[Daily Report] Found ${readings.length} readings.`);

    // Build data maps
    // `length` is the raw payload key; multiplied by LENGTH_TO_KG to get kg
    const dataMap = new Map<number, number>();
    const operatorMap = new Map<number, string>();
    const productMap = new Map<number, string>();

    for (const reading of readings) {
      const timestamp = new Date(reading.recorded_at);
      if (Number.isNaN(timestamp.getTime())) continue;
      timestamp.setSeconds(0, 0);
      const timestampMs = timestamp.getTime();
      const { length, operator, product } = reading.payload ?? {};

      if (length != null) {
        const raw = Number(length);
        if (Number.isFinite(raw)) dataMap.set(timestampMs, raw * LENGTH_TO_KG);
      }
      if (operator != null) operatorMap.set(timestampMs, String(operator));
      if (product != null) productMap.set(timestampMs, String(product));
    }

    // Initialize accumulators
    const findFirstValid = (map: Map<number, string>) =>
      Array.from(map.values()).find((v) => v && v !== 'Unknown') ?? 'None';
    let lastOperator = findFirstValid(operatorMap);
    let lastProduct = findFirstValid(productMap);
    let cumulativeProduction = 0; // kg
    let activeMinutes = 0;
    let idleMinutes = 0;
    let offlineMinutes = 0;
    let totalStops = 0;
    let lastStatus: number | null = null;

    // Time series and shift tracking
    const times: string[] = [];
    const cumulativeValues: number[] = [];
    const products: string[] = [];
    const statusData: {
      time: Date;
      status: number;
      operator: string;
      product: string;
    }[] = [];

    // Day Shift: 08:00–20:00 IST | Night Shift: 20:00–08:00 IST
    const shiftStats: ShiftStats[] = [
      {
        name: 'Day Shift',
        production: 0,
        activeMin: 0,
        idleMin: 0,
        offlineMin: 0,
        stops: 0,
      },
      {
        name: 'Night Shift',
        production: 0,
        activeMin: 0,
        idleMin: 0,
        offlineMin: 0,
        stops: 0,
      },
    ];

    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    // Process each minute
    for (
      let timestampMs = startMs;
      timestampMs < endMs;
      timestampMs += 60_000
    ) {
      const dateAtTimestamp = new Date(timestampMs);
      const { hour: istHour, minute: istMinute } = getISTTime(dateAtTimestamp);
      const decimalHour = istHour + istMinute / 60;

      // Day Shift: 08:00–20:00; Night Shift: 20:00–08:00
      const shift =
        shiftStats[decimalHour >= 8.0 && decimalHour < 20.0 ? 0 : 1];
      if (!shift) continue;

      // Update latest operator/product
      const rawOperator = operatorMap.get(timestampMs);
      const rawProduct = productMap.get(timestampMs);
      if (rawOperator && rawOperator !== 'Unknown') lastOperator = rawOperator;
      if (rawProduct && rawProduct !== 'Unknown') lastProduct = rawProduct;

      // Determine status: 1=Active, 0=Idle, -1=Offline
      const productionValue = dataMap.get(timestampMs);
      let currentStatus = -1;

      if (productionValue !== undefined) {
        currentStatus = productionValue > 0 ? 1 : 0;
        if (currentStatus === 1) {
          cumulativeProduction += productionValue;
          activeMinutes++;
          shift.activeMin++;
          shift.production += productionValue;
        } else {
          idleMinutes++;
          shift.idleMin++;
        }
      } else {
        offlineMinutes++;
        shift.offlineMin++;
      }

      // Count stops (active → non-active)
      if (lastStatus === 1 && currentStatus !== 1) {
        totalStops++;
        shift.stops++;
      }
      lastStatus = currentStatus;

      times.push(dateAtTimestamp.toISOString());
      cumulativeValues.push(parseFloat(cumulativeProduction.toFixed(1)));
      products.push(lastProduct);
      statusData.push({
        time: dateAtTimestamp,
        status: currentStatus,
        operator: lastOperator,
        product: lastProduct,
      });
    }

    // Calculate summary metrics
    const totalProduction = parseFloat(cumulativeProduction.toFixed(1));
    const totalMinutes = activeMinutes + idleMinutes + offlineMinutes;
    const utilization =
      totalMinutes > 0 ? Math.round((activeMinutes / totalMinutes) * 100) : 0;
    const averageSpeed =
      activeMinutes > 0
        ? Math.round(totalProduction / (activeMinutes / 60))
        : 0;

    // Build unique products list
    const uniqueProducts = Array.from(
      new Set(products.filter((p) => p && p !== 'Unknown' && p !== 'None'))
    );
    if (uniqueProducts.length === 0) uniqueProducts.push('Production');

    // --- HOURLY PRODUCTION ---
    const hourFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const hourLabels = Array.from({ length: 24 }, (_, i) =>
      hourFormatter.format(new Date(startMs + i * 60 * 60 * 1000))
    );
    const hourlyProductCounts: Record<string, number[]> = {};
    uniqueProducts.forEach((p) => {
      hourlyProductCounts[p] = Array(24).fill(0);
    });

    let previousCumulativeValue = 0;
    times.forEach((timeValue, index) => {
      const cumulativeValue = cumulativeValues[index];
      if (!timeValue || cumulativeValue === undefined) return;

      const timestamp = new Date(timeValue).getTime();
      if (!Number.isFinite(timestamp)) return;

      const bucketIndex = Math.floor((timestamp - startMs) / (60 * 60 * 1000));
      if (bucketIndex < 0 || bucketIndex >= 24) return;

      const product = products[index] ?? 'Unknown';
      const productKey = uniqueProducts.includes(product)
        ? product
        : uniqueProducts[0];
      if (!productKey || !hourlyProductCounts[productKey]) return;

      const increment = Math.max(0, cumulativeValue - previousCumulativeValue);
      const arr = hourlyProductCounts[productKey]!;
      arr[bucketIndex] = (arr[bucketIndex] ?? 0) + increment;
      previousCumulativeValue = cumulativeValue;
    });

    // --- PRODUCTION CHART ---
    const chartColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    const barDatasets = uniqueProducts.map((product, index) => ({
      label: product,
      data: hourlyProductCounts[product] ?? Array(24).fill(0),
      backgroundColor: chartColors[index % chartColors.length] ?? '#2563eb',
    }));

    const barChartConfig = {
      type: 'bar',
      data: { labels: hourLabels, datasets: barDatasets },
      options: {
        title: {
          display: true,
          text: 'Hourly Production (kg)',
          fontSize: 14,
          fontColor: '#0f172a',
        },
        scales: {
          xAxes: [
            {
              stacked: true,
              gridLines: { color: '#e2e8f0' },
              ticks: { fontSize: 8, fontColor: '#64748b' },
            },
          ],
          yAxes: [
            {
              stacked: true,
              gridLines: { color: '#e2e8f0' },
              ticks: { fontSize: 9, fontColor: '#64748b', beginAtZero: true },
            },
          ],
        },
        legend: { position: 'top', labels: { fontSize: 9, boxWidth: 12 } },
      },
    };

    const barChartUrl =
      `https://quickchart.io/chart?w=700&h=260&c=` +
      encodeURIComponent(JSON.stringify(barChartConfig));

    // --- HOURLY GANTT TIMELINE ---
    const timelineSegments: { status: number; count: number }[] = [];
    if (statusData.length > 0) {
      let currentSegment = { status: statusData[0]!.status, count: 0 };
      for (const s of statusData) {
        if (s.status === currentSegment.status) {
          currentSegment.count++;
        } else {
          timelineSegments.push(currentSegment);
          currentSegment = { status: s.status, count: 1 };
        }
      }
      timelineSegments.push(currentSegment);
    }

    const totalTimelineMinutes = statusData.length || 1440;
    const timelineHtml = timelineSegments
      .map((seg) => {
        const widthPercent = (seg.count / totalTimelineMinutes) * 100;
        let color = '#dc2626'; // offline
        if (seg.status === 1)
          color = '#059669'; // active
        else if (seg.status === 0) color = '#d97706'; // idle
        return `<td style="width:${widthPercent}%;background-color:${color};height:24px;padding:0;"></td>`;
      })
      .join('');

    const axisHtml = hourLabels
      .map((label, idx) => {
        const showLabel = idx % 2 === 0;
        return `<td style="width:${100 / 24}%;text-align:left;font-size:9px;color:#64748b;padding-top:6px;">${showLabel ? label : ''}</td>`;
      })
      .join('');

    const ganttChartHtml = `
      <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px;padding:12px 12px 0 12px;">Hourly Machine Utilisation</div>
      <div style="padding:0 12px 16px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:4px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>${timelineHtml}</tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;margin-top:2px;">
          <tr>${axisHtml}</tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
          <tr>
            <td width="33%" style="font-size:11px;color:#374151;"><span style="display:inline-block;width:12px;height:12px;background-color:#059669;border-radius:2px;margin-right:6px;vertical-align:middle;"></span> Active</td>
            <td width="33%" style="font-size:11px;color:#374151;"><span style="display:inline-block;width:12px;height:12px;background-color:#d97706;border-radius:2px;margin-right:6px;vertical-align:middle;"></span> Idle</td>
            <td width="33%" style="font-size:11px;color:#374151;"><span style="display:inline-block;width:12px;height:12px;background-color:#dc2626;border-radius:2px;margin-right:6px;vertical-align:middle;"></span> Offline</td>
          </tr>
        </table>
      </div>
    `;

    // --- SHIFT METRICS ---
    const getShiftUtilisation = (shift: ShiftStats): number => {
      const total = shift.activeMin + shift.idleMin + shift.offlineMin;
      return total > 0 ? Math.round((shift.activeMin / total) * 100) : 0;
    };

    // --- SHIFT CARDS ---
    const shiftCardsHtml = shiftStats
      .map((s) => {
        const utilisation = getShiftUtilisation(s);
        const totalTime = s.activeMin + s.idleMin + s.offlineMin;
        const activePct = totalTime > 0 ? (s.activeMin / totalTime) * 100 : 0;
        const idlePct = totalTime > 0 ? (s.idleMin / totalTime) * 100 : 0;
        const offlinePct = totalTime > 0 ? (s.offlineMin / totalTime) * 100 : 0;
        return `
      <td width="50%" valign="top" style="padding:0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <tr>
            <td style="padding:14px;">
              <!-- HEADER -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:14px;font-weight:700;color:#0f172a;">
                      ${escapeHtml(s.name)}
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:3px 7px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:10px;font-weight:700;">
                      ${s.stops} stops
                    </span>
                  </td>
                </tr>
              </table>
              <!-- MAIN METRICS -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                <tr>
                  <td width="62px" valign="middle">
                    <table role="presentation" width="56" height="56" cellpadding="0" cellspacing="0" border="0"
                      style="width:56px;height:56px;border-radius:50%;background:#dcfce7;">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="font-size:15px;line-height:17px;font-weight:800;color:#047857;">
                            ${utilisation}%
                          </div>
                          <div style="margin-top:1px;font-size:8px;line-height:9px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;">
                            Util.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:10px;">
                    <div style="font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#64748b;">
                      Production
                    </div>
                    <div style="margin-top:2px;font-size:19px;line-height:22px;font-weight:800;color:#0f172a;overflow-wrap:anywhere;word-break:break-word;">
                      ${s.production.toFixed(1)}
                      <span style="font-size:10px;font-weight:500;color:#64748b;">kg</span>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- MACHINE TIME -->
              <div style="margin-top:14px;margin-bottom:6px;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#64748b;">
                Machine Time
              </div>
              <!-- TIME BAR -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:8px;">
                <tr>
                  ${
                    activePct > 0
                      ? `<td width="${activePct}%" style="height:8px;background:#10b981;border-radius:4px 0 0 4px;font-size:0;line-height:0;">&nbsp;</td>`
                      : ''
                  }
                  ${
                    idlePct > 0
                      ? `<td width="${idlePct}%" style="height:8px;background:#f59e0b;font-size:0;line-height:0;">&nbsp;</td>`
                      : ''
                  }
                  ${
                    offlinePct > 0
                      ? `<td width="${offlinePct}%" style="height:8px;background:#94a3b8;border-radius:0 4px 4px 0;font-size:0;line-height:0;">&nbsp;</td>`
                      : ''
                  }
                </tr>
              </table>
              <!-- TIME LEGEND -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:7px;">
                <tr>
                  <td width="33%" valign="top">
                    <div>
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;"></span>
                      <span style="margin-left:3px;font-size:9px;color:#64748b;">Active</span>
                    </div>
                    <div style="margin-top:1px;font-size:10px;font-weight:700;color:#374151;">
                      ${formatDuration(s.activeMin)}
                    </div>
                  </td>
                  <td width="33%" valign="top">
                    <div>
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span>
                      <span style="margin-left:3px;font-size:9px;color:#64748b;">Idle</span>
                    </div>
                    <div style="margin-top:1px;font-size:10px;font-weight:700;color:#374151;">
                      ${formatDuration(s.idleMin)}
                    </div>
                  </td>
                  <td width="33%" valign="top">
                    <div>
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94a3b8;"></span>
                      <span style="margin-left:3px;font-size:9px;color:#64748b;">Offline</span>
                    </div>
                    <div style="margin-top:1px;font-size:10px;font-weight:700;color:#374151;">
                      ${formatDuration(s.offlineMin)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    `;
      })
      .join('');

    // --- EMAIL HTML ---
    const emailHtml = `<!DOCTYPE html>
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
            <div style="margin-top:6px;font-size:14px;line-height:20px;color:#cbd5e1;">
              ${escapeHtml(ownerInfo.deviceName)}
            </div>
            <div style="margin-top:14px;font-size:12px;line-height:18px;color:#94a3b8;">
              ${escapeHtml(reportDateStr)} — ${escapeHtml(startTimeStr)} to ${escapeHtml(endTimeStr)} IST
            </div>
          </td>
        </tr>

        <!-- KPI GRID -->
        <tr>
          <td style="padding:24px 28px 24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" valign="top" style="padding:0 6px 12px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:16px;">
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;">Total Production</div>
                        <div style="margin-top:7px;font-size:25px;line-height:30px;font-weight:700;color:#0f172a;">
                          ${totalProduction.toLocaleString()}
                        </div>
                        <div style="margin-top:3px;font-size:11px;color:#94a3b8;">kg produced</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="50%" valign="top" style="padding:0 0 12px 6px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:16px;">
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;">Machine Utilisation</div>
                        <div style="margin-top:7px;font-size:25px;line-height:30px;font-weight:700;color:#059669;">
                          ${utilization}%
                        </div>
                        <div style="margin-top:3px;font-size:11px;color:#94a3b8;">
                          ${formatDuration(activeMinutes)} active · ${formatDuration(idleMinutes)} idle
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="50%" valign="top" style="padding:0 6px 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:16px;">
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;">Production Rate</div>
                        <div style="margin-top:7px;font-size:25px;line-height:30px;font-weight:700;color:#0f172a;">
                          ${averageSpeed.toLocaleString()}
                        </div>
                        <div style="margin-top:3px;font-size:11px;color:#94a3b8;">kg/hr during active time</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="50%" valign="top" style="padding:0 0 0 6px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:16px;">
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;">Production Stops</div>
                        <div style="margin-top:7px;font-size:25px;line-height:30px;font-weight:700;color:#0f172a;">
                          ${totalStops}
                        </div>
                        <div style="margin-top:3px;font-size:11px;color:#94a3b8;">active-to-inactive transitions</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SHIFT BREAKDOWN -->
        <tr>
          <td style="padding:0 28px 28px 28px;">
            <div style="margin-bottom:12px;font-size:15px;font-weight:700;color:#0f172a;">Shift Performance</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${shiftCardsHtml}
              </tr>
            </table>
          </td>
        </tr>

        <!-- CHARTS -->
        <tr>
          <td style="padding:0 28px 28px 28px;">
            <div style="margin-bottom:14px;font-size:15px;font-weight:700;color:#0f172a;">Production &amp; Utilisation Trends</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;background:#ffffff;border-radius:6px;margin-bottom:14px;">
              <tr>
                <td style="padding:12px;">
                  <img src="${barChartUrl}" width="600" alt="Hourly production" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;background:#ffffff;border-radius:6px;">
              <tr>
                <td style="padding:0;">
                  ${ganttChartHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- VIEW RECORDS LINK -->
        <tr>
          <td style="padding:0 28px 32px 28px;">
            <div style="font-size:12px;color:#64748b;">
              View full records:
              <a href="${recordsUrl}" target="_blank" style="color:#2563eb;text-decoration:underline;">${recordsUrl}</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

    // Save preview
    await Bun.write('test_production_count_report_preview.html', emailHtml);
    console.log(
      '[Daily Report] Preview saved to test_production_count_report_preview.html'
    );

    // Send email
    const shouldSendEmail =
      process.env.SEND_EMAIL === 'true' ||
      process.env.NODE_ENV === 'production';

    if (shouldSendEmail) {
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      if (!smtpUser) {
        throw new Error(
          'SMTP_USER or GMAIL_USER environment variable required.'
        );
      }

      await transporter.sendMail({
        from: `"Vizibble Reports" <${smtpUser}>`,
        to: recipientEmails.join(', '),
        subject: `Daily Performance Report — ${ownerInfo.deviceName} — ${reportDateStr}`,
        html: emailHtml,
      });

      console.log(
        `[Daily Report] Email sent to ${recipientEmails.length} recipient(s).`
      );
    } else {
      console.log('[Daily Report] Local environment: email preview only.');
    }

    console.log(
      `[Daily Report] Complete. Production: ${totalProduction} kg, ` +
        `Utilisation: ${utilization}%, Active: ${formatDuration(activeMinutes)}, ` +
        `Idle: ${formatDuration(idleMinutes)}, Offline: ${formatDuration(offlineMinutes)}, ` +
        `Stops: ${totalStops}.`
    );
  } catch (error) {
    console.error('[Daily Report] Error:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
