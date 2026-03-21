import { useMemo } from 'react';

import { Activity } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSensorStore } from '@/pages/home/store/sensor-store';

/**
 * Calculates the total length accumulated today (since local midnight).
 * Uses the raw `recorded_at` timestamps stored alongside history in the store,
 * but since the store only keeps formatted labels we derive "today" by checking
 * if a label starts with today's date string (HH:MM format) — because history
 * in instant mode contains all readings from the query window.
 * We sum ALL values in the history window as the backend returns "today's" data.
 */
export const PulseStat = () => {
  const history = useSensorStore((s) => s.history['length']);
  const lastTimestamp = useSensorStore((s) => s.lastTimestamp);
  const sensorValues = useSensorStore((s) => s.sensorValues);

  const { todayTotal, lastValue } = useMemo(() => {
    const values = history?.values ?? [];
    const todayTotal = values.reduce((sum, v) => sum + v, 0);
    // Latest live or historical value
    const lastValue = sensorValues['length'] ?? values.at(-1) ?? null;
    return { todayTotal, lastValue };
  }, [history, sensorValues]);

  const status =
    lastValue === null
      ? { label: 'Offline', color: 'text-red-500', bg: 'bg-red-50 border-red-200' }
      : lastValue > 0
        ? { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
        : { label: 'Idle', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };

  const lastSeenLabel = useMemo(() => {
    if (!lastTimestamp) return null;
    const diff = Math.floor((Date.now() - new Date(lastTimestamp).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [lastTimestamp]);

  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2 space-y-0">
        <Activity className="text-emerald-500" size={16} />
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Total Length
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-2">
        {/* Big number */}
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-slate-800 tabular-nums leading-none">
            {todayTotal.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-slate-400 mb-1">pulses</span>
        </div>

        {/* Status badge + last seen */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              status.label === 'Active' ? 'bg-emerald-500 animate-pulse' :
              status.label === 'Idle' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            {status.label}
          </span>
          {lastSeenLabel && (
            <span className="text-xs text-slate-400">Last reading {lastSeenLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
