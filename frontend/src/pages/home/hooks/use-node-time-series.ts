import { useMemo } from 'react';
import type { FieldHistory } from '@/pages/home/types/types';

export interface SensorHistoryData {
  rawTimes?: string[];
  times?: string[];
  values?: (number | string | boolean)[];
}

export interface AnalogSensorSeries {
  key: string;
  label: string;
  times: string[];
  values: (number | null)[];
  latestValue: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
}

export interface NodeShiftSummary {
  name: string;
  production: number;
  utilization: number;
  hours: number;
  activeMinutes: number;
  idleMinutes: number;
  offlineMinutes: number;
  stops: number;
  threadBreakSeconds: number;
}

export interface NodeSummary {
  totalProduction: number;
  avgSpeed: number;
  utilization: number;
  activeMinutes: number;
  idleMinutes: number;
  offlineMinutes: number;
  totalStops: number;
  totalThreadBreakSeconds: number;
  isThreadBreakActive: boolean;
  shifts: NodeShiftSummary[];
  currentShiftIndex: number;
}

export const useNodeTimeSeries = (
  history: Record<string, SensorHistoryData | FieldHistory | undefined>,
  targetDate: Date = new Date()
) => {
  return useMemo(() => {
    // Node devices report discrete pulses under the 'count' key
    const countTimes = history['count']?.rawTimes ?? [];
    const countValues = (history['count']?.values as number[]) ?? [];

    // Thread break data
    const tbTimes = history['thread_break']?.rawTimes ?? [];
    const tbValues = (history['thread_break']?.values as number[]) ?? [];

    const threadBreakMap = new Map<number, number>();
    for (let i = 0; i < tbTimes.length; i++) {
      let d = new Date(tbTimes[i]);
      if (isNaN(d.getTime())) {
        const parts = tbTimes[i].split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          d = new Date(targetDate);
          d.setHours(parts[0], parts[1], 0, 0);
        } else {
          continue;
        }
      }
      d.setSeconds(0, 0);
      threadBreakMap.set(d.getTime(), Number(tbValues[i]) || 0);
    }

    // Build lookup for count values
    const dataMap = new Map<number, number>();
    for (let i = 0; i < countTimes.length; i++) {
      let d = new Date(countTimes[i]);
      if (isNaN(d.getTime())) {
        const parts = countTimes[i].split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          d = new Date(targetDate);
          d.setHours(parts[0], parts[1], 0, 0);
        } else {
          continue;
        }
      }
      d.setSeconds(0, 0);
      dataMap.set(d.getTime(), Math.round(Number(countValues[i]) || 0));
    }

    // Operational day logic: 08:00 AM shift start
    const now = new Date();
    const isLive = !targetDate || targetDate.toDateString() === now.toDateString();
    const operationalDate = new Date(targetDate ?? now);

    if (isLive && now.getHours() < 8) {
      operationalDate.setDate(operationalDate.getDate() - 1);
    }

    const startTimeLocal = new Date(operationalDate);
    startTimeLocal.setHours(8, 0, 0, 0);
    const startTime = startTimeLocal.getTime();

    let endTime: number;
    if (isLive) {
      now.setSeconds(0, 0);
      endTime = Math.min(now.getTime(), startTime + 24 * 3600 * 1000);
    } else {
      endTime = startTime + 24 * 3600 * 1000 - 60_000;
    }

    // Two 12-hour shifts: Day Shift (08:00 - 20:00) and Night Shift (20:00 - 08:00 next day)
    const SHIFTS = [
      { name: 'Day Shift', start: 8, end: 20 },
      { name: 'Night Shift', start: 20, end: 8 },
    ];

    const shiftStats = SHIFTS.map((s) => ({
      name: s.name,
      production: 0,
      activeMin: 0,
      idleMin: 0,
      offlineMin: 0,
      stops: 0,
      threadBreakSeconds: 0,
    }));

    // Output arrays
    const times: string[] = [];
    const cumulativeValues: number[] = [];
    // statusData format: [isoStr, yCoord (1), statusCode (1=active, 0=idle, -1=offline), reason]
    const statusData: [string, number, number, string?][] = [];
    const threadBreakValues: number[] = [];

    // Initialize hourly buckets from startTime up to current hour
    const totalHoursToInclude = Math.max(
      1,
      Math.min(24, Math.floor((endTime - startTime) / (3600 * 1000)) + 1)
    );
    const hourlyThreadBreak: { hour: string; timestamp: number; seconds: number }[] = [];
    for (let h = 0; h < totalHoursToInclude; h++) {
      const bTime = startTime + h * 3600 * 1000;
      const bDate = new Date(bTime);
      hourlyThreadBreak.push({
        hour: bDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        timestamp: bTime,
        seconds: 0,
      });
    }

    let cumulativeSum = 0;
    let activeMinutes = 0;
    let idleMinutes = 0;
    let offlineMinutes = 0;
    let totalStops = 0;
    let totalThreadBreakSeconds = 0;
    let lastStatus: number | null = null;

    for (let t = startTime; t <= endTime; t += 60_000) {
      const dateAtT = new Date(t);
      const isoStr = dateAtT.toISOString();
      const h = dateAtT.getHours() + dateAtT.getMinutes() / 60;

      // Determine shift: 8 to 20 is Day Shift (index 0), else Night Shift (index 1)
      const shiftIndex = (h >= 8 && h < 20) ? 0 : 1;
      const ss = shiftStats[shiftIndex];

      // Thread break for this minute
      const tbSec = threadBreakMap.get(t) ?? 0;
      totalThreadBreakSeconds += tbSec;
      ss.threadBreakSeconds += tbSec;
      threadBreakValues.push(tbSec);

      const hourIdx = Math.floor((t - startTime) / (3600 * 1000));
      if (hourIdx >= 0 && hourIdx < 24) {
        hourlyThreadBreak[hourIdx].seconds += tbSec;
      }

      if (dataMap.has(t)) {
        const val = dataMap.get(t)!;

        if (val > 0) {
          cumulativeSum += val;
          activeMinutes++;
          statusData.push([isoStr, 1, 1, tbSec > 0 ? `Running (Break: ${tbSec}s)` : 'Running']);
          ss.production += val;
          ss.activeMin++;
        } else {
          idleMinutes++;
          const reason = tbSec > 0 ? `Thread break (${tbSec}s)` : 'Idle (0 count)';
          statusData.push([isoStr, 1, 0, reason]);
          ss.idleMin++;
        }
      } else {
        offlineMinutes++;
        statusData.push([isoStr, 1, -1, 'Offline']);
        ss.offlineMin++;
      }

      // Stop detection: previous minute was active, current minute is not
      const currentStatusCode = statusData[statusData.length - 1][2];
      if (lastStatus === 1 && currentStatusCode !== 1) {
        totalStops++;
        ss.stops++;
      }
      lastStatus = currentStatusCode;

      times.push(isoStr);
      cumulativeValues.push(Math.round(cumulativeSum));
    }

    const totalProduction = Math.round(cumulativeSum);
    const totalMinutes = activeMinutes + idleMinutes + offlineMinutes;
    const utilization =
      totalMinutes > 0 ? Math.round((activeMinutes / totalMinutes) * 100) : 0;
    const avgSpeed =
      activeMinutes > 0 ? Math.round(totalProduction / (activeMinutes / 60)) : 0;

    const shiftSummaries: NodeShiftSummary[] = shiftStats.map((ss) => {
      const shiftTotalMinutes = ss.activeMin + ss.idleMin + ss.offlineMin;
      return {
        name: ss.name,
        production: ss.production,
        utilization:
          shiftTotalMinutes > 0
            ? Math.round((ss.activeMin / shiftTotalMinutes) * 100)
            : 0,
        hours: parseFloat((shiftTotalMinutes / 60).toFixed(1)),
        activeMinutes: ss.activeMin,
        idleMinutes: ss.idleMin,
        offlineMinutes: ss.offlineMin,
        stops: ss.stops,
        threadBreakSeconds: Math.round(ss.threadBreakSeconds),
      };
    });

    // Currently active shift
    const curH = now.getHours() + now.getMinutes() / 60;
    const currentShiftIndex = (curH >= 8 && curH < 20) ? 0 : 1;

    // Latest thread break active state
    const tbActiveVals = history['thread_break_active']?.values ?? [];
    const isThreadBreakActive =
      tbActiveVals.length > 0 ? Boolean(tbActiveVals[tbActiveVals.length - 1]) : false;

    // Exclude only the core device metadata & pulse/break keys; all other keys are dynamic analog sensors
    const EXCLUDED_KEYS = new Set([
      'device_id',
      'ts',
      'uptime',
      'count',
      'thread_break',
      'thread_break_active',
      'timestamp',
      'connectionID',
    ]);

    const analogSensors: AnalogSensorSeries[] = [];
    for (const [key, fieldData] of Object.entries(history)) {
      if (!fieldData || EXCLUDED_KEYS.has(key)) continue;

      const numVals = (fieldData.values ?? []).filter(
        (v): v is number => typeof v === 'number' && !isNaN(v)
      );
      if (numVals.length === 0) continue;

      const sMap = new Map<number, number>();
      const sTimes = fieldData.rawTimes ?? [];
      const sVals = fieldData.values ?? [];
      for (let i = 0; i < sTimes.length; i++) {
        let d = new Date(sTimes[i]);
        if (isNaN(d.getTime())) {
          const parts = sTimes[i].split(':').map(Number);
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            d = new Date(targetDate);
            d.setHours(parts[0], parts[1], 0, 0);
          } else {
            continue;
          }
        }
        d.setSeconds(0, 0);
        const valNum = Number(sVals[i]);
        if (!isNaN(valNum)) {
          sMap.set(d.getTime(), valNum);
        }
      }

      const alignedVals: (number | null)[] = [];
      for (let t = startTime; t <= endTime; t += 60_000) {
        alignedVals.push(sMap.has(t) ? sMap.get(t)! : null);
      }

      const validAligned = alignedVals.filter((v): v is number => v !== null);
      const sum = validAligned.reduce((a, b) => a + b, 0);
      const avg = validAligned.length > 0 ? parseFloat((sum / validAligned.length).toFixed(2)) : null;
      const min = validAligned.length > 0 ? parseFloat(Math.min(...validAligned).toFixed(2)) : null;
      const max = validAligned.length > 0 ? parseFloat(Math.max(...validAligned).toFixed(2)) : null;
      const latestValue = validAligned.length > 0 ? validAligned[validAligned.length - 1] : null;

      analogSensors.push({
        key,
        label: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        times,
        values: alignedVals,
        latestValue,
        avg,
        min,
        max,
      });
    }

    const summary: NodeSummary = {
      totalProduction,
      avgSpeed,
      utilization,
      activeMinutes,
      idleMinutes,
      offlineMinutes,
      totalStops,
      totalThreadBreakSeconds: Math.round(totalThreadBreakSeconds),
      isThreadBreakActive,
      shifts: shiftSummaries,
      currentShiftIndex,
    };

    return {
      times,
      cumulativeValues,
      statusData,
      summary,
      threadBreak: {
        totalSeconds: Math.round(totalThreadBreakSeconds),
        isActive: isThreadBreakActive,
        hourly: hourlyThreadBreak,
        times,
        values: threadBreakValues,
      },
      analogSensors,
    };
  }, [history, targetDate]);
};
