import { useRef, useMemo } from 'react';

import type ReactECharts from 'echarts-for-react';

import { BarChart } from '@/components/bar-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

interface LoomCumulativeBarChartProps {
  /** ISO timestamps for minutes that are active or idle (not offline gaps) */
  times: string[];
  /** Running cumulative production/count total at each time point */
  values: number[];
  /** Product name for each timestamp */
  products?: string[];
  /** The date being viewed — defaults to today */
  targetDate?: Date;
}

export const LoomCumulativeBarChart = ({
  times,
  values,
  products = [],
  targetDate,
}: LoomCumulativeBarChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  // Axis bounds: midnight → end of the viewed day
  const [axisMin, axisMax] = useMemo(() => {
    const base = targetDate ?? new Date();
    const operationalDate = new Date(base);
    // If we're looking at "today" (no specific targetDate or targetDate is today)
    // and it's before 8:30 AM, then the operational day is yesterday.
    if (!targetDate || targetDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      if (now.getHours() < 8 || (now.getHours() === 8 && now.getMinutes() < 30)) {
        operationalDate.setDate(operationalDate.getDate() - 1);
      }
    }

    const startTimeLocal = new Date(operationalDate);
    startTimeLocal.setHours(8, 30, 0, 0);
    const startMs = startTimeLocal.getTime();
    const isToday = operationalDate.toDateString() === new Date().toDateString();

    if (isToday) {
      const now = new Date();
      now.setSeconds(0, 0);
      // Ensure we don't go past the 24h window
      const currentMax = Math.min(now.getTime(), startMs + 24 * 3600 * 1000);
      return [startMs, currentMax];
    }
    return [startMs, startMs + 24 * 3600 * 1000 - 60_000];
  }, [targetDate]);

  // Group and calculate hourly total count per product dynamically into 24 hourly buckets
  const seriesDataMap = useMemo(() => {
    // Unique products
    const uniqueProds = Array.from(new Set(products.map((p) => p || 'Unknown')));
    if (uniqueProds.length === 0) {
      uniqueProds.push('Count');
    }

    // Generate 24 hourly timestamps starting from axisMin
    const bucketTimestamps: number[] = [];
    for (let h = 0; h < 24; h++) {
      bucketTimestamps.push(axisMin + h * 3600 * 1000);
    }

    // Initialize series data arrays (24 points for each product)
    const productSeries: Record<string, [number, number][]> = {};
    uniqueProds.forEach((p) => {
      productSeries[p] = bucketTimestamps.map((t) => [t, 0]);
    });

    let lastVal = 0;

    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]).getTime();
      const val = values[i];
      const prod = products[i] || 'Unknown';
      const increment = Math.max(0, val - lastVal);
      lastVal = val;

      // Find which hour bucket this timestamp falls into relative to axisMin
      const bucketIdx = Math.floor((t - axisMin) / (3600 * 1000));
      if (bucketIdx >= 0 && bucketIdx < 24) {
        const arr = productSeries[prod];
        if (arr && arr[bucketIdx]) {
          arr[bucketIdx][1] += increment; // Add specifically to this hour slot!
        }
      }
    }

    return { uniqueProds, productSeries };
  }, [times, values, products, axisMin]);

  const options = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const timeStr = new Date(params[0].axisValue).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          let content = `<b>${timeStr}</b>`;
          let total = 0;
          (params as { marker: string; seriesName: string; value: number | [number, number] }[]).forEach(
            (p) => {
              const val = Array.isArray(p.value) ? p.value[1] : p.value;
              if (val > 0) {
                content += `<br/>${p.marker} ${p.seriesName}: <b>${val.toFixed(0)}</b>`;
                total += val;
              }
            }
          );
          if (params.length > 1) {
            content += `<br/>📊 Total: <b>${total.toFixed(0)}</b>`;
          }
          return content;
        },
        axisPointer: { type: 'shadow' as const },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
      },
      dataZoom: [],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'time' as const,
        min: axisMin - 30 * 60 * 1000, // 30 mins buffer before first hour
        max: axisMax + 30 * 60 * 1000, // 30 mins buffer after last hour
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
      series: seriesDataMap.uniqueProds.map((prod, idx) => {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const color = colors[idx % colors.length];

        return {
          name: prod,
          type: 'bar' as const,
          stack: 'total',
          data: seriesDataMap.productSeries[prod],
          itemStyle: {
            color: color,
          },
          barWidth: '75%',
        };
      }),
    }),
    [seriesDataMap, axisMin, axisMax]
  );

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Hourly Count"
        isFullscreen={isFullscreen}
        onDownload={() =>
          chartRef.current && downloadChart(chartRef, 'Hourly Count')
        }
        onToggleFullscreen={toggle}
      />
      <div className={isFullscreen ? 'flex-1' : ''}>
        <BarChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '260px'}
          options={options}
        />
      </div>
    </ChartContainer>
  );
};
