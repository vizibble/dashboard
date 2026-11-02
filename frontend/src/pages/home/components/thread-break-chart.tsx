import { useRef, useMemo } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BarChart } from '@/components/bar-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

interface ThreadBreakChartProps {
  hourlyData: { hour: string; timestamp: number; seconds: number }[];
  totalSeconds?: number;
  isActive?: boolean;
  times?: string[];
  values?: number[];
  targetDate?: Date;
}

export const ThreadBreakChart = ({
  hourlyData,
  totalSeconds = 0,
  values = [],
}: ThreadBreakChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  // Compute stats
  const { totalIncidents, maxBreakSec } = useMemo(() => {
    let incidents = 0;
    let maxSec = 0;
    let inBreak = false;
    for (const val of values) {
      if (val > 0) {
        if (!inBreak) {
          incidents++;
          inBreak = true;
        }
        if (val > maxSec) maxSec = val;
      } else {
        inBreak = false;
      }
    }
    return {
      totalIncidents: incidents,
      maxBreakSec: maxSec,
    };
  }, [values]);

  const formatDuration = (sec: number) => {
    if (!sec || sec === 0) return '0s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const chartOptions: EChartsOption = useMemo(() => {
    const xLabels = hourlyData.map((d) => d.hour);
    // Convert to minutes for readable Y axis if appropriate, or keep seconds
    const dataVals = hourlyData.map((d) => d.seconds);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const p = params[0] as { name: string; value: number };
          return `
            <div style="font-family: inherit; font-size: 12px; padding: 2px;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Hour: ${p.name}</div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f43f5e;"></span>
                <span>Break Duration: <b>${formatDuration(p.value)}</b> (${p.value}s)</span>
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
        data: xLabels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Sec',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (v: number) => `${v}s`,
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: 'Thread Break (sec)',
          type: 'bar',
          data: dataVals,
          barMaxWidth: 24,
          itemStyle: {
            color: '#f43f5e',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [hourlyData]);

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Thread Break"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'thread-break')}
        onToggleFullscreen={toggle}
      />
      <div className={isFullscreen ? 'flex-1 p-4' : 'p-2'}>
        <BarChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '260px'}
          options={chartOptions}
        />
      </div>
      <footer className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Total:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {formatDuration(totalSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Incidents:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {totalIncidents}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Max:</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
            {formatDuration(maxBreakSec)}
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
