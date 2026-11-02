import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { NodeSummary } from '@/pages/home/hooks/use-node-time-series';

interface NodeStatsProps {
  summary: NodeSummary;
  isHistory?: boolean;
  unit?: string;
}

const formatMinutes = (min: number) => {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatBreakDuration = (sec?: number) => {
  if (sec === undefined || sec === 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

export const NodeStats = ({ summary, isHistory, unit = 'kg' }: NodeStatsProps) => {
  const targetPerShift = unit === 'pcs' ? 30000 : 90;
  const numShifts = summary.shifts.length || 1;
  const totalTarget = targetPerShift * numShifts;

  const [activeTab, setActiveTab] = useState<'all' | number>(
    isHistory ? 'all' : summary.currentShiftIndex >= 0 ? summary.currentShiftIndex : 'all'
  );

  const currentShift = typeof activeTab === 'number' ? summary.shifts[activeTab] : null;

  const currentProduction = currentShift ? currentShift.production : summary.totalProduction;
  const currentTarget = currentShift ? targetPerShift : totalTarget;
  const currentOee = currentShift ? currentShift.utilization : summary.utilization;
  const currentActiveMin = currentShift ? currentShift.activeMinutes : summary.activeMinutes;
  const currentIdleMin = currentShift ? currentShift.idleMinutes : summary.idleMinutes;
  const currentOfflineMin = currentShift ? currentShift.offlineMinutes : summary.offlineMinutes;
  const currentStops = currentShift ? (currentShift.stops ?? 0) : summary.totalStops;
  const currentBreakSec = currentShift ? currentShift.threadBreakSeconds : summary.totalThreadBreakSeconds;

  const targetPct = currentTarget > 0 ? Math.min(100, Math.round((currentProduction / currentTarget) * 100)) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Bar with Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700">
            {isHistory ? 'Machine Records' : 'Machine Status'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500">
            {typeof activeTab === 'number'
              ? `${summary.shifts[activeTab]?.name} (${summary.shifts[activeTab]?.hours} hrs)`
              : 'Full Day'}
          </span>
        </div>

        {/* Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1 font-semibold rounded-md transition-all cursor-pointer',
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            All Day
          </button>
          {summary.shifts.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={cn(
                'px-3 py-1 font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === idx
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5 Clean Metric Cells */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Production */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Production
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {currentProduction.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">{unit}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${targetPct}%`,
                  backgroundColor: targetPct >= 80 ? '#10b981' : targetPct >= 50 ? '#3b82f6' : '#f59e0b',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Target: {currentTarget.toLocaleString()} {unit}</span>
              <span className="font-semibold text-slate-600">{targetPct}%</span>
            </div>
          </div>
        </div>

        {/* OEE */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            OEE
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {currentOee}%
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {formatMinutes(currentActiveMin)} active running
          </div>
        </div>

        {/* Active Time */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Active Time
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {formatMinutes(currentActiveMin)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate">
            {formatMinutes(currentIdleMin)} idle · {formatMinutes(currentOfflineMin)} off
          </div>
        </div>

        {/* Stops */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Stops
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {currentStops}
              </span>
              <span className="text-xs font-semibold text-slate-400">stops</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Total stops recorded
          </div>
        </div>

        {/* Thread Break */}
        <div className="p-4 sm:p-5 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Thread Break
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {formatBreakDuration(currentBreakSec)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Total break downtime
          </div>
        </div>
      </div>
    </div>
  );
};
