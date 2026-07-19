import { useMemo } from 'react';

/**
 * Processes raw loom API data into a 24-hour time series.
 *
 * Raw data shape:
 *   times[]  — ISO timestamps for minutes that EXIST in the DB (midnight → now)
 *   values[] — fabric length produced in that minute
 *
 * Minute classification:
 *   value > 0  → ACTIVE  (loom is running, fabric produced)
 *   value === 0 → IDLE   (minute present but no production)
 *   missing     → OFFLINE (machine was off, no record)
 */
export const useLoomTimeSeries = (
  history: Record<string, any>,
  targetDate: Date = new Date(),
  isCount: boolean = false
) => {
  return useMemo(() => {
    const conversionFactor = isCount ? 1.0 : 0.10781818;
    const valueKey = isCount ? 'count' : 'length';

    const propTimes = history[valueKey]?.rawTimes ?? [];
    const propValues = (history[valueKey]?.values as number[]) ?? [];

    // Build lookup maps for text fields by timestamp
    const operatorMap = new Map<number, string>();
    const productMap = new Map<number, string>();
    const reasonMap = new Map<number, string>();

    (history['operator']?.rawTimes ?? []).forEach((t: string, i: number) => {
      const d = new Date(t);
      d.setSeconds(0, 0);
      operatorMap.set(d.getTime(), String(history['operator']?.values[i] ?? ''));
    });
    (history['product']?.rawTimes ?? []).forEach((t: string, i: number) => {
      const d = new Date(t);
      d.setSeconds(0, 0);
      productMap.set(d.getTime(), String(history['product']?.values[i] ?? ''));
    });
    (history['idle_reason']?.rawTimes ?? []).forEach((t: string, i: number) => {
      const d = new Date(t);
      d.setSeconds(0, 0);
      reasonMap.set(d.getTime(), String(history['idle_reason']?.values[i] ?? ''));
    });

    // Build a fast lookup: timestamp (ms, seconds zeroed) → value
    const dataMap = new Map<number, number>();
    for (let i = 0; i < propTimes.length; i++) {
      let d = new Date(propTimes[i]);
      // If it's a formatted time string like "HH:mm" or "HH:mm:ss" (which sensor-store outputs), new Date() will fail.
      if (isNaN(d.getTime())) {
        const parts = propTimes[i].split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          d = new Date(targetDate);
          d.setHours(parts[0], parts[1], 0, 0);
        } else {
          continue;
        }
      }
      d.setSeconds(0, 0);
      dataMap.set(d.getTime(), propValues[i] * conversionFactor);
    }

    // PRODUCTION DAY LOGIC:
    const operationalDate = new Date(targetDate);
    if (targetDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      if (isCount) {
        if (now.getHours() < 8 || (now.getHours() === 8 && now.getMinutes() < 30)) {
          operationalDate.setDate(operationalDate.getDate() - 1);
        }
      } else {
        if (now.getHours() < 6) {
          operationalDate.setDate(operationalDate.getDate() - 1);
        }
      }
    }

    const startTimeLocal = new Date(operationalDate);
    if (isCount) {
      startTimeLocal.setHours(8, 30, 0, 0);
    } else {
      startTimeLocal.setHours(6, 0, 0, 0);
    }
    const startTime = startTimeLocal.getTime();

    const isToday = operationalDate.toDateString() === new Date().toDateString();
    const isCurrentlyToday = isToday;

    let endTime;
    if (isCurrentlyToday) {
      const now = new Date();
      now.setSeconds(0, 0);
      // Ensure we don't go past the 24h window
      endTime = Math.min(now.getTime(), startTime + 24 * 3600 * 1000);
    } else {
      endTime = startTime + 24 * 3600 * 1000 - 60_000;
    }

    // Shift definitions:
    // count: Day Shift (08:30 - 20:30), Night Shift (20:30 - 08:30 next day)
    // production_count: Shift A (6-14), Shift B (14-22), Shift C (22-6)
    const SHIFTS = isCount
      ? [
          { name: 'Day Shift', start: 8.5, end: 20.5 },
          { name: 'Night Shift', start: 20.5, end: 8.5 },
        ]
      : [
          { name: 'Shift A', start: 6, end: 14 },
          { name: 'Shift B', start: 14, end: 22 },
          { name: 'Shift C', start: 22, end: 6 },
        ];

    const now = new Date();

    // Map to hold shift-specific accumulators
    const shiftStats = SHIFTS.map((s) => ({
      name: s.name,
      production: 0,
      activeMin: 0,
      idleMin: 0,
      offlineMin: 0,
      stops: 0,
      startHour: s.start,
      endHour: s.end,
    }));

    // Output arrays
    const times: string[] = []; // ISO string for every minute
    const cumulativeValues: number[] = []; // running total of production
    const products: string[] = []; // running product names
    const statusData: [string, number, number, string?, string?, string?][] = []; // [isoStr, 1, statusCode, reason, operator, product]

    // Find first non-empty operator and product from the entire day
    let lastOperator = Array.from(operatorMap.values()).find((v) => v && v !== 'Unknown') || '';
    let lastProduct = Array.from(productMap.values()).find((v) => v && v !== 'Unknown') || '';

    let cumulativeSum = 0;
    let activeMinutes = 0;
    let idleMinutes = 0;
    let offlineMinutes = 0;
    let totalStops = 0;
    let lastStatus: number | null = null; // 1=active, 0=idle, -1=offline

    for (let t = startTime; t <= endTime; t += 60_000) {
      const dateAtT = new Date(t);
      const isoStr = dateAtT.toISOString();
      const h = dateAtT.getHours() + dateAtT.getMinutes() / 60;

      let shiftIndex = 0;
      if (isCount) {
        if (h >= 8.5 && h < 20.5) {
          shiftIndex = 0;
        } else {
          shiftIndex = 1;
        }
      } else {
        if (h >= 6 && h < 14) shiftIndex = 0;
        else if (h >= 14 && h < 22) shiftIndex = 1;
        else shiftIndex = 2; // (h >= 22 || h < 6)
      }

      const ss = shiftStats[shiftIndex];

      const rawOp = operatorMap.get(t);
      const rawProd = productMap.get(t);
      if (rawOp && rawOp !== 'Unknown') lastOperator = rawOp;
      if (rawProd && rawProd !== 'Unknown') lastProduct = rawProd;

      const op = lastOperator;
      const prod = lastProduct;
      const rsn = reasonMap.get(t) ?? '';

      if (dataMap.has(t)) {
        const val = dataMap.get(t)!;

        if (val > 0) {
          // ACTIVE — loom running, fabric produced
          cumulativeSum += val;
          activeMinutes++;
          statusData.push([isoStr, 1, 1, rsn, op, prod]);
          ss.production += val;
          ss.activeMin++;
        } else {
          // IDLE — minute exists but no production
          idleMinutes++;
          statusData.push([isoStr, 1, 0, rsn, op, prod]);
          ss.idleMin++;
        }
      } else {
        // OFFLINE — minute missing from data
        offlineMinutes++;
        statusData.push([isoStr, 1, -1, rsn, op, prod]);
        ss.offlineMin++;
      }

      // STOP DETECTION: If previous minute was ACTIVE and current is NOT, it's a stop.
      if (lastStatus === 1 && (statusData[statusData.length - 1][2] !== 1)) {
        totalStops++;
        ss.stops++;
      }
      lastStatus = statusData[statusData.length - 1][2];

      // Always emit a cumulative point
      times.push(isoStr);
      cumulativeValues.push(isCount ? Math.round(cumulativeSum) : parseFloat(cumulativeSum.toFixed(1)));
      products.push(prod || 'Unknown');
    }

    const totalProduction = isCount ? Math.round(cumulativeSum) : parseFloat(cumulativeSum.toFixed(1));
    const totalMinutes = activeMinutes + idleMinutes + offlineMinutes;
    const utilization =
      totalMinutes > 0 ? Math.round((activeMinutes / totalMinutes) * 100) : 0;
    const avgSpeed =
      activeMinutes > 0
        ? Math.round(totalProduction / (activeMinutes / 60))
        : 0;

    // Format shift summaries
    const shiftSummaries = shiftStats.map((ss) => {
      const shiftTotalMinutes = ss.activeMin + ss.idleMin + ss.offlineMin;
      return {
        name: ss.name,
        production: isCount ? Math.round(ss.production) : parseFloat(ss.production.toFixed(1)),
        utilization:
          shiftTotalMinutes > 0
            ? Math.round((ss.activeMin / shiftTotalMinutes) * 100)
            : 0,
        hours: parseFloat((shiftTotalMinutes / 60).toFixed(1)),
        activeMinutes: ss.activeMin,
        idleMinutes: ss.idleMin,
        offlineMinutes: ss.offlineMin,
        stops: ss.stops,
      };
    });

    // Determine currently active shift (if today)
    let currentShiftIndex = 0;
    if (isCurrentlyToday) {
      const h = now.getHours() + now.getMinutes() / 60;
      if (isCount) {
        if (h >= 8.5 && h < 20.5) {
          currentShiftIndex = 0;
        } else {
          currentShiftIndex = 1;
        }
      } else {
        if (h >= 6 && h < 14) currentShiftIndex = 0;
        else if (h >= 14 && h < 22) currentShiftIndex = 1;
        else currentShiftIndex = 2; // (h >= 22 || h < 6)
      }
    }

    return {
      times,
      cumulativeValues,
      products,
      statusData,
      summary: {
        totalProduction,
        avgSpeed,
        utilization,
        activeMinutes,
        idleMinutes,
        offlineMinutes,
        totalStops,
        // Detailed shifts
        shifts: shiftSummaries,
        currentShiftIndex,
        latestOperator: lastOperator || 'None',
        latestProduct: lastProduct || 'None',
      },
    };
  }, [history, targetDate, isCount]);
};
