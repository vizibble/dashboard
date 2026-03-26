import { useRef, useMemo } from 'react';

import type ReactECharts from 'echarts-for-react';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

const STATE_COLORS = {
  active:  '#22c55e',
  idle:    '#eab308',
  offline: '#ef4444',
};

const STATE_LABELS = {
  active:  'Active',
  idle:    'Idle',
  offline: 'Offline',
};

interface MachineStatusChartProps {
  statusData: [string, number, number][];
  summary: {
    activeMinutes: number;
    idleMinutes: number;
    offlineMinutes: number;
  };
  /** The date being viewed — defaults to today */
  targetDate?: Date;
}

/** Convert statusData into contiguous segments for the custom series */
function buildSegments(statusData: [string, number, number][]) {
  if (statusData.length === 0) return [];

  type Segment = { start: number; end: number; state: 'active' | 'idle' | 'offline' };
  const segments: Segment[] = [];

  const stateOf = (code: number): Segment['state'] =>
    code === 1 ? 'active' : code === 0 ? 'idle' : 'offline';

  let segStart = new Date(statusData[0][0]).getTime();
  let segState = stateOf(statusData[0][2]);

  for (let i = 1; i < statusData.length; i++) {
    const t = new Date(statusData[i][0]).getTime();
    const s = stateOf(statusData[i][2]);
    if (s !== segState) {
      segments.push({ start: segStart, end: t, state: segState });
      segStart = t;
      segState = s;
    }
  }
  // push last segment up to one-minute past the last timestamp
  const lastT = new Date(statusData[statusData.length - 1][0]).getTime() + 60_000;
  segments.push({ start: segStart, end: lastT, state: segState });

  return segments;
}

export const MachineStatusChart = ({ statusData, summary, targetDate }: MachineStatusChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  const segments = useMemo(() => buildSegments(statusData), [statusData]);

  const options = useMemo(() => {
    // Span the correct day: midnight → now (today) or midnight → 23:59 (historical)
    const base = targetDate ?? new Date();
    const midnight = new Date(base);
    midnight.setHours(0, 0, 0, 0);
    const midnightMs = midnight.getTime();
    const isToday = base.toDateString() === new Date().toDateString();
    const endMs = isToday
      ? (() => { const d = new Date(); d.setSeconds(0, 0); return d.getTime(); })()
      : (() => { const d = new Date(base); d.setHours(23, 59, 0, 0); return d.getTime(); })();
    const startTs = midnightMs;
    const endTs = endMs + 60_000; // +1 min so last segment fills to right edge

    return {
      tooltip: {
        trigger: 'item' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const { start, end, state } = params.data;
          const fmt = (ts: number) =>
            new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const durationMin = Math.round((end - start) / 60_000);
          const dot = state === 'active' ? '🟢' : state === 'idle' ? '🟡' : '🔴';
          return `<b>${fmt(start)} – ${fmt(end)}</b><br/>${dot} ${STATE_LABELS[state as keyof typeof STATE_LABELS]} (${durationMin} min)`;
        },
      },
      animation: false,
      grid: { left: '1%', right: '1%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: {
        type: 'time' as const,
        min: startTs,
        max: endTs,
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          formatter: (val: number) =>
            new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { show: false },
      },
      yAxis: {
        show: false,
        min: 0,
        max: 1,
      },
      series: [
        {
          type: 'custom' as const,
          renderItem: (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            api: any,
          ) => {
            const seg = segments[params.dataIndex];
            const x1 = api.coord([seg.start, 0])[0];
            const x2 = api.coord([seg.end,   0])[0];
            const y0 = api.coord([0, 0])[1];
            const y1 = api.coord([0, 1])[1];
            const color = STATE_COLORS[seg.state as keyof typeof STATE_COLORS];
            const w = Math.max(x2 - x1, 1);
            const h = y0 - y1;
            return {
              type: 'group' as const,
              children: [
                {
                  type: 'rect' as const,
                  shape: { x: x1, y: y1, width: w, height: h },
                  style: { fill: color, opacity: 0.25 },
                },
                {
                  type: 'rect' as const,
                  shape: { x: x1, y: y1, width: w, height: 3 },
                  style: { fill: color, opacity: 0.85 },
                },
              ],
            };
          },
          data: segments.map(seg => ({
            value: [seg.start, 1],
            start: seg.start,
            end:   seg.end,
            state: seg.state,
          })),
          encode: { x: 0, y: 1 },
          z: 2,
        },
      ],
    };
  }, [segments, targetDate]);

  return (
    <ChartContainer isFullscreen={isFullscreen} className='mt-3'>
      <ChartHeader
        title="Machine Status per Minute"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'Machine Status')}
        onToggleFullscreen={toggle}
      />

      {statusData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          No data available
        </div>
      ) : (
        <div className={isFullscreen ? 'flex-1' : ''}>
          <LineChart
            ref={chartRef}
            height={isFullscreen ? '100%' : '180px'}
            options={options}
          />
        </div>
      )}

      {/* Summary row */}
      <footer className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS.active }} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{STATE_LABELS.active}</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums text-emerald-600 bg-emerald-50 border-emerald-100">
            {summary.activeMinutes} min
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS.idle }} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{STATE_LABELS.idle}</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums text-yellow-600 bg-yellow-50 border-yellow-100">
            {summary.idleMinutes} min
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS.offline }} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{STATE_LABELS.offline}</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums text-red-600 bg-red-50 border-red-100">
            {summary.offlineMinutes} min
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
            {summary.activeMinutes + summary.idleMinutes + summary.offlineMinutes} min
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
