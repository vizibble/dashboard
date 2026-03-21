import { useMemo, useRef } from 'react';

import type ReactECharts from 'echarts-for-react';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { useSensorStore } from '@/pages/home/store/sensor-store';
import { downloadChart } from '@/pages/home/utils/download-chart';

const STATE_COLORS = {
  active: '#22c55e',
  idle:   '#eab308',
  offline: '#ef4444',
};

const STATE_LABELS = {
  active: 'Active',
  idle:   'Idle',
  offline: 'Offline',
};

export const MachineStatusChart = () => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  const history = useSensorStore((s) => s.history['length']);

  const { times, statusData, summary } = useMemo(() => {
    const times = history?.times ?? [];
    const values = history?.values ?? [];

    // Binary status: 1 for active (>0 pulses), 0 for idle (0 pulses).
    const statusData = values.map((v) => (v > 0 ? 1 : 0));

    const summary = {
      active: statusData.reduce((s, v) => s + v, 0),
      idle:   statusData.length - statusData.reduce((s, v) => s + v, 0),
    };

    return { times, statusData, summary };
  }, [history]);

  const options = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: { value: number; name: string }[]) => {
        const p = params[0];
        if (!p) return '';
        const state = p.value === 1 ? 'Active' : 'Idle';
        const color = p.value === 1 ? '🟢' : '🟡';
        return `<b>${p.name}</b><br/>${color} ${state}`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: times,
      axisLabel: {
        fontSize: 10,
        color: '#94a3b8',
        rotate: 30,
        interval: Math.max(0, Math.floor(times.length / 8) - 1),
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 1.2,
      show: false,
    },
    visualMap: {
      show: false,
      dimension: 1,
      pieces: [
        { gt: 0.5, color: STATE_COLORS.active }, // Active
        { lte: 0.5, color: STATE_COLORS.idle },   // Idle
      ],
    },
    series: [
      {
        name: 'Machine Status',
        type: 'line' as const,
        data: statusData,
        step: 'start' as const, // Creates the square wave (state transition) look
        symbol: 'none',
        areaStyle: {
          opacity: 0.2, // Subtle background fill
        },
        lineStyle: {
          width: 3,
        },
      },
    ],
  };

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Machine Status per Minute"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'Machine Status')}
        onToggleFullscreen={toggle}
      />

      {times.length === 0 ? (
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
            {summary.active} min
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS.idle }} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{STATE_LABELS.idle}</span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums text-yellow-600 bg-yellow-50 border-yellow-100">
            {summary.idle} min
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
            {summary.active + summary.idle} min
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
