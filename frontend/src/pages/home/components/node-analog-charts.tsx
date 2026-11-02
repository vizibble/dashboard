import { useState, useRef, useMemo } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { Chart } from '@/pages/home/components/chart';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';
import { cn } from '@/lib/utils';
import type { AnalogSensorSeries } from '@/pages/home/hooks/use-node-time-series';

interface NodeAnalogChartsProps {
  sensors: AnalogSensorSeries[];
  times?: string[];
}

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

export const NodeAnalogCharts = ({ sensors }: NodeAnalogChartsProps) => {
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('combined');
  const combinedChartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(combinedChartRef);

  // Generate combined multi-series chart options unconditionally
  const combinedOptions: EChartsOption = useMemo(() => {
    if (!sensors || sensors.length === 0) return {};

    const timeLabels = sensors[0]?.times.map((t: string) => {
      const d = new Date(t);
      return !isNaN(d.getTime())
        ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
        : t;
    }) ?? [];

    const series = sensors.map((sensor, idx) => {
      const color = PALETTE[idx % PALETTE.length];
      return {
        name: sensor.label,
        type: 'line' as const,
        data: sensor.values,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: {
          opacity: 0.08,
          color,
        },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const first = params[0] as { name: string };
          let content = `<div style="font-family: inherit; font-size: 12px; padding: 2px;">
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">Time: ${first.name}</div>`;
          for (const item of params as Array<{ marker: string; seriesName: string; value: number | null }>) {
            const valStr = item.value !== null && item.value !== undefined ? Number(item.value).toFixed(2) : '-';
            content += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 2px;">
              <span>${item.marker} ${item.seriesName}:</span>
              <span style="font-weight: 700; color: #0f172a;">${valStr}</span>
            </div>`;
          }
          content += '</div>';
          return content;
        },
      },
      legend: {
        data: sensors.map((s) => s.label),
        top: 8,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      grid: {
        top: 48,
        right: 24,
        bottom: 28,
        left: 48,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series,
    };
  }, [sensors]);

  if (!sensors || sensors.length === 0) {
    return null;
  }

  // Options for individual single-sensor charts
  const getSingleSensorOptions = (sensor: AnalogSensorSeries, color: string): EChartsOption => {
    const timeLabels = sensor.times.map((t: string) => {
      const d = new Date(t);
      return !isNaN(d.getTime())
        ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
        : t;
    });

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: unknown) =>
          val !== null && val !== undefined ? Number(val).toFixed(2) : '-',
      },
      grid: {
        top: 24,
        right: 16,
        bottom: 24,
        left: 48,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: sensor.label,
          type: 'line',
          data: sensor.values,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: {
            opacity: 0.12,
            color,
          },
        },
      ],
    };
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header and Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            VFD Signals
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 font-medium">
            {sensors.length} channels
          </span>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            className={cn(
              'px-3 py-1 font-semibold rounded-md transition-all cursor-pointer',
              viewMode === 'combined'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
            onClick={() => setViewMode('combined')}
          >
            Combined
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1 font-semibold rounded-md transition-all cursor-pointer',
              viewMode === 'separate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
            onClick={() => setViewMode('separate')}
          >
            Separate
          </button>
        </div>
      </div>

      {/* Sensor Value Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {sensors.map((sensor, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return (
            <div
              key={sensor.key}
              className="flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate" title={sensor.label}>
                  {sensor.label}
                </span>
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none my-1.5">
                {sensor.latestValue !== null ? sensor.latestValue.toFixed(2) : '-'}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                <span>Avg <b className="text-slate-600 font-mono">{sensor.avg ?? '-'}</b></span>
                <span>Max <b className="text-slate-600 font-mono">{sensor.max ?? '-'}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Views */}
      {viewMode === 'combined' ? (
        <ChartContainer isFullscreen={isFullscreen}>
          <ChartHeader
            title="Analog Channels"
            isFullscreen={isFullscreen}
            onDownload={() =>
              combinedChartRef.current && downloadChart(combinedChartRef, 'analog-sensors-combined')
            }
            onToggleFullscreen={toggle}
          />
          <div className={cn('min-h-0', isFullscreen ? 'flex-1 p-4' : 'p-2')}>
            <LineChart
              ref={combinedChartRef}
              height={isFullscreen ? '100%' : '300px'}
              options={combinedOptions}
            />
          </div>
        </ChartContainer>
      ) : (
        <div className={cn('grid gap-4 md:gap-6', sensors.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
          {sensors.map((sensor, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            return (
              <Chart
                key={sensor.key}
                title={sensor.label}
                height="280px"
                options={getSingleSensorOptions(sensor, color)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
