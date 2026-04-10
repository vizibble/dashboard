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
      dataMap.set(d.getTime(), propValues[i]);
    }

    // 24-hour window
    // If today, end at current time. If past date, end at 23:59:00.
    const isToday = targetDate.toDateString() === new Date().toDateString();

    const midnight = new Date(targetDate);
    midnight.setHours(0, 0, 0, 0);
    const startTime = midnight.getTime();

    let endTime;
    if (isToday) {
      const now = new Date();
      now.setSeconds(0, 0);
      endTime = now.getTime();
    } else {
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 0, 0);
      endTime = endOfDay.getTime();
    }

    // Shift definitions: 00-08, 08-16, 16-24
    const SHIFTS = [
      { name: 'Shift 1', start: 0, end: 8 },
      { name: 'Shift 2', start: 8, end: 16 },
      { name: 'Shift 3', start: 16, end: 24 },
    ];

    const isCurrentlyToday =
      targetDate.toDateString() === new Date().toDateString();
    const now = new Date();

    // Map to hold shift-specific accumulators
    const shiftStats = SHIFTS.map((s) => ({
      name: s.name,
      production: 0,
      activeMin: 0,
      idleMin: 0,
      offlineMin: 0,
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

    for (let t = startTime; t <= endTime; t += 60_000) {
      const dateAtT = new Date(t);
      const isoStr = dateAtT.toISOString();
      const h = dateAtT.getHours();

      // Which shift does this minute belong to?
      // Shift 1: 0-8, Shift 2: 8-16, Shift 3: 16-24
      let shiftIndex = -1;
      if (h >= 0 && h < 8) shiftIndex = 0;
      else if (h >= 8 && h < 16) shiftIndex = 1;
      else shiftIndex = 2; // (h >= 16 && h < 24)

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
      };
    });

    // Determine currently active shift (if today)
    let currentShiftIndex = 0;
    if (isCurrentlyToday) {
      const h = now.getHours();
      if (h >= 0 && h < 8) currentShiftIndex = 0;
      else if (h >= 8 && h < 16) currentShiftIndex = 1;
      else currentShiftIndex = 2; // (h >= 16 && h < 24)
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
        // Detailed shifts
        shifts: shiftSummaries,
        currentShiftIndex,
      },
    };
  }, [propTimes, propValues, targetDate]);
};
