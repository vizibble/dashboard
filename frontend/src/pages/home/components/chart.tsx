import { useRef } from 'react';

import type { EChartsOption, LineSeriesOption } from 'echarts';
import type ReactECharts from 'echarts-for-react';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartFooter } from '@/pages/home/components/chart-footer';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useChartStats } from '@/pages/home/hooks/chart-stats';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';
import { cn } from '@/utils/cn';

export type ChartProps = {
  title: string;
  options: EChartsOption;
  height?: string;
  className?: string;
  hideFooter?: boolean;
  hideStats?: boolean;
};

export const Chart = ({
  title,
  options,
  height = '280px',
  className,
  hideFooter = false,
  hideStats = false,
}: ChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  // Resize the chart canvas when the window changes size
  useChartResize(chartRef);
  // Derive footer stats from the first series
  const firstSeries = Array.isArray(options.series)
    ? (options.series[0] as LineSeriesOption | undefined)
    : (options.series as LineSeriesOption | undefined);
  const stats = useChartStats(firstSeries);

  return (
    <ChartContainer className={className} isFullscreen={isFullscreen}>
      <ChartHeader
        title={title}
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, title)}
        onToggleFullscreen={toggle}
      />
      <div className={cn('min-h-0', isFullscreen && 'flex-1')}>
        <LineChart
          ref={chartRef}
          height={isFullscreen ? '100%' : height}
          options={options}
        />
      </div>

      {!hideFooter && <ChartFooter options={options} stats={stats} hideStats={hideStats} />}
    </ChartContainer>
  );
};
