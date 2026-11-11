import { useCallback } from 'react';

import type { ChartTheme } from '@/app/pages/dashboards/shared/lib/chart-theme';
import { formatValue, thresholdColor } from '@/app/pages/dashboards/shared/lib/format';
import { EChart } from '@/app/pages/dashboards/shared/widgets/echart';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';

/** A single level against a configured range. With no reading the needle is hidden, not at 0. */
export function GaugeWidget({ presentation, result }: WidgetViewProps) {
  const reading = result.values[0]?.value;
  const value = typeof reading === 'number' ? reading : null;
  const min = presentation.min_value ?? 0;
  const max = presentation.max_value ?? 100;

  const option = useCallback(
    (theme: ChartTheme) => {
      const span = max - min || 1;
      const bands = [...presentation.thresholds]
        .filter((threshold) => threshold.value > min && threshold.value <= max)
        .sort((a, b) => a.value - b.value);
      // Each band colours the arc from its value up to the next band.
      const stops: [number, string][] = [];
      let color = presentation.color ?? theme.series[0] ?? '';
      for (const band of bands) {
        stops.push([(band.value - min) / span, color]);
        color = band.color;
      }
      stops.push([1, color]);

      return {
        animation: false,
        series: [
          {
            type: 'gauge',
            min,
            max,
            startAngle: 210,
            endAngle: -30,
            radius: '95%',
            center: ['50%', '58%'],
            axisLine: { lineStyle: { width: 10, color: stops } },
            progress: { show: false },
            pointer: { show: value !== null, length: '60%', width: 4, itemStyle: { color: theme.text } },
            anchor: { show: value !== null, size: 8, itemStyle: { color: theme.text } },
            axisTick: { show: false },
            splitLine: { length: 6, lineStyle: { color: theme.background, width: 2 } },
            axisLabel: { color: theme.muted, fontSize: 10, distance: 14 },
            title: { show: false },
            detail: {
              valueAnimation: false,
              offsetCenter: [0, '38%'],
              fontSize: 18,
              fontWeight: 600,
              color: (value !== null && thresholdColor(value, presentation.thresholds)) || theme.text,
              formatter: () => formatValue(value, result.metric, presentation),
            },
            data: [{ value: value ?? min }],
          },
        ],
      };
    },
    [max, min, presentation, result.metric, value],
  );

  return <EChart option={option} label={`${presentation.title}: ${formatValue(value, result.metric, presentation)}`} />;
}
