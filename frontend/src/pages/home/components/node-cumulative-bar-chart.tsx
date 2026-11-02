import { useRef, useMemo } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

import { BarChart } from '@/components/bar-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

interface NodeCumulativeBarChartProps {
  times: string[];
  values: number[];
  targetDate?: Date;
  unit?: string;
}

export const NodeCumulativeBarChart = ({
  times,
  values,
  targetDate,
  unit = 'kg',
}: NodeCumulativeBarChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  // 08:00 AM start time and current/end time
  const [axisMin, axisMax] = useMemo(() => {
    const now = new Date();
    const isLive = !targetDate || targetDate.toDateString() === now.toDateString();
    const base = targetDate ?? now;
    const operationalDate = new Date(base);

    if (isLive && now.getHours() < 8) {
      operationalDate.setDate(operationalDate.getDate() - 1);
    }

    const startTimeLocal = new Date(operationalDate);
    startTimeLocal.setHours(8, 0, 0, 0);
    const startMs = startTimeLocal.getTime();

    if (isLive) {
      now.setSeconds(0, 0);
      const currentMax = Math.min(now.getTime(), startMs + 24 * 3600 * 1000);
      return [startMs, currentMax];
    }
    return [startMs, startMs + 24 * 3600 * 1000 - 60_000];
  }, [targetDate]);

  // Aggregate pulses into hourly buckets up to current time
  const hourlyData = useMemo(() => {
    const totalHoursToInclude = Math.max(
      1,
      Math.min(24, Math.floor((axisMax - axisMin) / (3600 * 1000)) + 1)
    );
    const hourlyCounts = new Array(totalHoursToInclude).fill(0);
    const hourlyLabels: string[] = [];

    for (let h = 0; h < totalHoursToInclude; h++) {
      const bTime = axisMin + h * 3600 * 1000;
      const bDate = new Date(bTime);
      hourlyLabels.push(
        bDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    }

    let lastVal = 0;
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]).getTime();
      const val = values[i] ?? 0;
      const inc = Math.max(0, val - lastVal);
      lastVal = val;

      const bucketIdx = Math.floor((t - axisMin) / (3600 * 1000));
      if (bucketIdx >= 0 && bucketIdx < totalHoursToInclude) {
        hourlyCounts[bucketIdx] += inc;
      }
    }

    return hourlyLabels.map((hour, idx) => ({
      hour,
      count: hourlyCounts[idx],
    }));
  }, [times, values, axisMin, axisMax]);

  const options: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const p = params[0] as { name: string; value: number };
          return `
            <div style="font-family: inherit; font-size: 12px; padding: 2px;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Time: ${p.name}</div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>
                <span>Hourly Output: <b>${p.value.toLocaleString()} ${unit}</b></span>
              </div>
            </div>
          `;
        },
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
        data: hourlyData.map((d) => d.hour),
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: `Output (${unit})`,
          type: 'bar',
          data: hourlyData.map((d) => d.count),
          barMaxWidth: 24,
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [hourlyData, unit]);

  const totalOutput = values.length > 0 ? values[values.length - 1] : 0;
  const peakOutput = useMemo(() => {
    return hourlyData.reduce((max, d) => Math.max(max, d.count), 0);
  }, [hourlyData]);
  const activeHours = useMemo(() => {
    return hourlyData.filter((d) => d.count > 0).length;
  }, [hourlyData]);

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Hourly Output"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'hourly-output')}
        onToggleFullscreen={toggle}
      />
      <div className={isFullscreen ? 'flex-1 p-4' : 'p-2'}>
        <BarChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '260px'}
          options={options}
        />
      </div>
      <footer className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Total:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {totalOutput.toLocaleString()} {unit}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Peak:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {peakOutput.toLocaleString()} {unit}/h
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Active:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {activeHours} hrs
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
