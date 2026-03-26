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
export const useLoomTimeSeries = (propTimes: string[], propValues: number[], targetDate: Date = new Date()) => {
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

    // Output arrays
    const times: string[] = [];          // ISO string for every minute (active + idle only — used by cumulative chart)
    const cumulativeValues: number[] = []; // running total of production (metres)
    const statusData: [string, number, number][] = []; // [isoStr, 1, statusCode] — all minutes including offline

    let cumulativeSum = 0;
    let activeMinutes = 0;
    let idleMinutes = 0;
    let offlineMinutes = 0;

    for (let t = startTime; t <= endTime; t += 60_000) {
      const isoStr = new Date(t).toISOString();

      if (dataMap.has(t)) {
        const val = dataMap.get(t)!;

        if (val > 0) {
          // ACTIVE — loom running, fabric produced
          cumulativeSum += val;
          activeMinutes++;
          statusData.push([isoStr, 1, 1]);
        } else {
          // IDLE — minute exists but no production
          idleMinutes++;
          statusData.push([isoStr, 1, 0]);
        }
      } else {
        // OFFLINE — minute missing from data
        offlineMinutes++;
        statusData.push([isoStr, 1, -1]);
      }

      // Always emit a cumulative point so the chart shows a flat line during offline/idle
      times.push(isoStr);
      cumulativeValues.push(parseFloat(cumulativeSum.toFixed(1)));
    }

    const totalProduction = parseFloat(cumulativeSum.toFixed(1));
    // Utilization = active / (active + idle + offline) * 100, based on full window
    const totalMinutes = activeMinutes + idleMinutes + offlineMinutes;
    const utilization = totalMinutes > 0 ? Math.round((activeMinutes / totalMinutes) * 100) : 0;
    // Average speed in metres-per-hour based on active minutes only
    const avgSpeed = activeMinutes > 0
      ? Math.round(totalProduction / (activeMinutes / 60))
      : 0;

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
      },
    };
  }, [propTimes, propValues, targetDate]);
};
