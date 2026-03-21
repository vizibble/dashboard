import { useRef } from 'react';

import type ReactECharts from 'echarts-for-react';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { useSensorStore } from '@/pages/home/store/sensor-store';
import { downloadChart } from '@/pages/home/utils/download-chart';

export const PulseBarChart = () => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  const history = useSensorStore((s) => s.history['length']);
  const times = history?.times ?? [];
  const values = history?.values ?? [];

  const total = values.reduce((acc, v) => acc + v, 0);
  const avg = values.length > 0 ? total / values.length : 0;

  const options = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const p = (params as { name: string; value: number }[])[0];
        if (!p) return '';
        return `<b>${p.name}</b><br/>Length: <b>${p.value}</b> pulses`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: times,
      axisLabel: {
        fontSize: 10,
        color: '#94a3b8',
        rotate: 30,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value' as const,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
    },
    visualMap: {
      show: false,
      dimension: 1,
      seriesIndex: 0,
      pieces: [
        { gt: 0, color: '#22c55e' },  // green — active
        { lte: 0, color: '#eab308' }, // yellow — idle
      ],
    },
    series: [
      {
        name: 'Length',
        type: 'bar',
        data: values,
        barMaxWidth: 32,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Length per Minute"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'Length per Minute')}
        onToggleFullscreen={toggle}
      />

      <div className={isFullscreen ? 'flex-1' : ''}>
        <LineChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '260px'}
          options={options}
        />
      </div>

      {/* Custom footer: avg + total */}
      <footer className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg / min</span>
          <span className="text-[11px] font-mono font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 tabular-nums">
            {avg.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
