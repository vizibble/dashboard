import { BarChart, GaugeChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef, useState } from 'react';

import { readChartTheme, type ChartTheme } from '@/app/pages/dashboards/shared/lib/chart-theme';

// Only the pieces the dashboard uses, to keep the bundle small.
echarts.use([
  LineChart,
  BarChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export type EChartsOption = echarts.EChartsCoreOption;

/** Follows the app's light/dark class so charts re-theme with the rest of the UI. */
function useChartTheme() {
  const [theme, setTheme] = useState<ChartTheme>(readChartTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readChartTheme()));

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

type EChartProps = {
  option: (theme: ChartTheme) => EChartsOption;
  label: string;
};

/** Canvas chart that fills its parent and resizes with it. */
export function EChart({ option, label }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  const chartRef = useRef<echarts.ECharts | null>(null);

  const theme = useChartTheme();

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });

    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option(theme), {
      notMerge: true,
      lazyUpdate: true,
    });
  }, [option, theme]);

  return <div ref={ref} role="img" aria-label={label} className="size-full min-h-0" />;
}
