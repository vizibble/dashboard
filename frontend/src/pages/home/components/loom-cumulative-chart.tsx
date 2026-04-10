import { useRef, useMemo } from 'react';

import type ReactECharts from 'echarts-for-react';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

interface LoomCumulativeChartProps {
  /** ISO timestamps for minutes that are active or idle (not offline gaps) */
  times: string[];
  /** Running cumulative production total at each time point (metres) */
  values: number[];
  /** The date being viewed — defaults to today */
  targetDate?: Date;
}

export const LoomCumulativeChart = ({
  times,
  values,
  targetDate,
}: LoomCumulativeChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  // Build [timestamp, cumulative] pairs — ECharts time axis handles sparse data well
  const seriesData = useMemo(() => {
    return times.map((t, i) => [new Date(t).getTime(), values[i]]);
  }, [times, values]);

  // Axis bounds: midnight → end of the viewed day (now if today, 23:59 if historical)
  const [axisMin, axisMax] = useMemo(() => {
    const base = targetDate ?? new Date();
    const midnight = new Date(base);
    midnight.setHours(0, 0, 0, 0);
    const isToday = base.toDateString() === new Date().toDateString();
    if (isToday) {
      const now = new Date();
      now.setSeconds(0, 0);
      return [midnight.getTime(), now.getTime()];
    }
    const endOfDay = new Date(base);
    endOfDay.setHours(23, 59, 0, 0);
    return [midnight.getTime(), endOfDay.getTime()];
  }, [targetDate]);

  const options = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const p = params[0];
          if (!p) return '';
          const val = Array.isArray(p.value) ? p.value[1] : p.value;
          const timeStr = new Date(p.axisValue).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return `<b>${timeStr}</b><br/>Cumulative: <b>${val.toLocaleString()}</b> m`;
        },
        axisPointer: { type: 'line' as const },
      },
      dataZoom: [],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'time' as const,
        min: axisMin,
        max: axisMax,
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          hideOverlap: true,
          formatter: (val: number) =>
            new Date(val).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
        },
        minInterval: 3600 * 1000, // One hour
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
      },
      series: [
        {
          name: 'Cumulative Production',
          type: 'line' as const,
          data: seriesData,
          smooth: 0.05,
          symbol: 'none',
          // connectNulls: false keeps gaps where offline minutes are not plotted
          connectNulls: false,
          lineStyle: { width: 3, color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.35)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
              ],
            },
          },
        },
      ],
    }),
    [seriesData, axisMin, axisMax]
  );

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Cumulative Production"
        isFullscreen={isFullscreen}
        onDownload={() =>
          chartRef.current && downloadChart(chartRef, 'Cumulative Production')
        }
        onToggleFullscreen={toggle}
      />
      <div className={isFullscreen ? 'flex-1' : ''}>
        <LineChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '260px'}
          options={options}
        />
      </div>
    </ChartContainer>
  );
};
