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
  propTimes: string[],
  propValues: number[],
  targetDate: Date = new Date()
) => {
  return useMemo(() => {
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
      const CONVERSION_FACTOR = 0.10781818;
      dataMap.set(d.getTime(), propValues[i] * CONVERSION_FACTOR);
    }

    // PRODUCTION DAY LOGIC:
    // If it's before 6 AM today, the "current" production day started at 6 AM yesterday.
    const operationalDate = new Date(targetDate);
    if (targetDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      if (now.getHours() < 6) {
        operationalDate.setDate(operationalDate.getDate() - 1);
      }
    }

    const dayStartHour = 6;
    const startTimeLocal = new Date(operationalDate);
    startTimeLocal.setHours(dayStartHour, 0, 0, 0);
    const startTime = startTimeLocal.getTime();

    const isToday = operationalDate.toDateString() === new Date().toDateString();
    const isCurrentlyToday = isToday;

    let endTime;
    if (isCurrentlyToday) {
      const now = new Date();
      now.setSeconds(0, 0);
      // Ensure we don't go past the 24h window even if it's currently > 6am tomorrow
      endTime = Math.min(now.getTime(), startTime + 24 * 3600 * 1000);
    } else {
      endTime = startTime + 24 * 3600 * 1000 - 60_000;
    }

    // Shift definitions: 06-14, 14-22, 22-06
    const SHIFTS = [
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
    const times: string[] = []; // ISO string for every minute (active + idle only — used by cumulative chart)
    const cumulativeValues: number[] = []; // running total of production (metres)
    const statusData: [string, number, number][] = []; // [isoStr, 1, statusCode] — all minutes including offline

    let cumulativeSum = 0;
    let activeMinutes = 0;
    let idleMinutes = 0;
    let offlineMinutes = 0;
    let totalStops = 0;
    let lastStatus: number | null = null; // 1=active, 0=idle, -1=offline

    for (let t = startTime; t <= endTime; t += 60_000) {
      const dateAtT = new Date(t);
      const isoStr = dateAtT.toISOString();
      const h = dateAtT.getHours();

      // Which shift does this minute belong to?
      // Shift A: 06-14, Shift B: 14-22, Shift C: 22-06
      let shiftIndex = -1;
      if (h >= 6 && h < 14) shiftIndex = 0;
      else if (h >= 14 && h < 22) shiftIndex = 1;
      else shiftIndex = 2; // (h >= 22 || h < 6)

      const ss = shiftStats[shiftIndex];

      if (dataMap.has(t)) {
        const val = dataMap.get(t)!;

        if (val > 0) {
          // ACTIVE — loom running, fabric produced
          cumulativeSum += val;
          activeMinutes++;
          statusData.push([isoStr, 1, 1]);
          ss.production += val;
          ss.activeMin++;
        } else {
          // IDLE — minute exists but no production
          idleMinutes++;
          statusData.push([isoStr, 1, 0]);
          ss.idleMin++;
        }
      } else {
        // OFFLINE — minute missing from data
        offlineMinutes++;
        statusData.push([isoStr, 1, -1]);
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
      cumulativeValues.push(parseFloat(cumulativeSum.toFixed(1)));
    }

    const totalProduction = parseFloat(cumulativeSum.toFixed(1));
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
        production: parseFloat(ss.production.toFixed(1)),
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
    if (isCurrentlyToday) {
      const h = now.getHours();
      if (h >= 6 && h < 14) currentShiftIndex = 0;
      else if (h >= 14 && h < 22) currentShiftIndex = 1;
      else currentShiftIndex = 2; // (h >= 22 || h < 6)
    }
    }

    return {
      times,
      cumulativeValues,
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
      },
    };
  }, [propTimes, propValues, targetDate]);
};
