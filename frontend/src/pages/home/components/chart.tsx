import { useRef } from "react";

import type { EChartsOption, LineSeriesOption } from "echarts";
import type ReactECharts from "echarts-for-react";

import { LineChart } from "@/components/line-chart";
import { ChartFooter } from "@/pages/home/components/chart-footer";
import { ChartHeader } from "@/pages/home/components/chart-header";
import { useChartResize } from "@/pages/home/hooks/chart-resize";
import { useChartStats } from "@/pages/home/hooks/chart-stats";
import { useFullscreen } from "@/pages/home/hooks/fullscreen";
import { downloadChart } from "@/pages/home/utils/download-chart";
import { cn } from "@/utils/cn";
import { ChartContainer } from "@/pages/home/components/chart-container";

export type ChartProps = {
  title: string;
  options: EChartsOption;
  height?: string;
  className?: string;
};

export const Chart = ({
  title,
  options,
  height = "280px",
  className,
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
    <ChartContainer isFullscreen={isFullscreen} className={className}>
      <ChartHeader
        title={title}
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, title)}
        onToggleFullscreen={toggle}
      />
      <div className={cn("min-h-0", isFullscreen && "flex-1")}>
        <LineChart
          ref={chartRef}
          options={options}
          height={isFullscreen ? "100%" : height}
        />
      </div>

      <ChartFooter stats={stats} options={options} />
    </ChartContainer>
  );
};
