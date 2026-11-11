import { useCallback } from 'react';

import { withAlpha, type ChartTheme } from '@/app/pages/dashboards/shared/lib/chart-theme';
import { formatTimestamp, formatValue } from '@/app/pages/dashboards/shared/lib/format';
import { EChart } from '@/app/pages/dashboards/shared/widgets/echart';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';

/**
 * Line, area and bar charts share this component; only the series style differs.
 * Null points are passed through, so gaps in telemetry show as gaps, never as zero.
 */
export function TimeSeriesWidget({ presentation, result }: WidgetViewProps) {
  const option = useCallback(
    (theme: ChartTheme) => {
      const type = presentation.type;
      const many = result.series.length > 1;
      const days = (result.range.to.getTime() - result.range.from.getTime()) / 86_400_000;
      const tz = result.range.timezone;
      const unit = presentation.show_unit && presentation.aggregation !== 'count' ? result.metric?.symbol : null;

      return {
        animation: false,
        color: presentation.color && !many ? [presentation.color] : theme.series,
        grid: {
          left: 8,
          right: 12,
          top: unit ? 22 : 10,
          bottom: presentation.show_legend && many ? 30 : 6,
          containLabel: true,
        },
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: theme.background,
          borderColor: theme.border,
          textStyle: { color: theme.text, fontSize: 12 },
          valueFormatter: (value: unknown) =>
            formatValue(typeof value === 'number' ? value : null, result.metric, presentation),
          axisPointer: { type: type === 'bar' ? 'shadow' : 'line' },
        },
        legend: {
          show: presentation.show_legend && many,
          bottom: 0,
          type: 'scroll',
          icon: 'roundRect',
          itemWidth: 10,
          itemHeight: 4,
          textStyle: { color: theme.muted, fontSize: 11 },
        },
        xAxis: {
          type: 'time',
          min: result.range.from.getTime(),
          max: result.range.to.getTime(),
          axisLine: { lineStyle: { color: theme.border } },
          axisTick: { show: false },
          axisLabel: {
            color: theme.muted,
            fontSize: 11,
            hideOverlap: true,
            formatter: (value: number) =>
              days > 2
                ? new Intl.DateTimeFormat(undefined, { timeZone: tz, day: 'numeric', month: 'short' }).format(value)
                : formatTimestamp(new Date(value), tz, false),
          },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          name: unit ?? undefined,
          nameTextStyle: { color: theme.muted, fontSize: 11, align: 'left' },
          min: presentation.min_value ?? undefined,
          max: presentation.max_value ?? undefined,
          scale: presentation.min_value === null,
          axisLabel: { color: theme.muted, fontSize: 11 },
          splitLine: { lineStyle: { color: theme.border } },
        },
        series: result.series.map((series, index) => ({
          name: series.device_name ?? result.metric?.label ?? 'All devices',
          type: type === 'bar' ? 'bar' : 'line',
          showSymbol: series.points.filter((point) => point.value !== null).length < 2,
          symbolSize: 5,
          connectNulls: false,
          barMaxWidth: 18,
          lineStyle: { width: 1.75 },
          ...(type === 'area'
            ? {
                areaStyle: {
                  opacity: 1,
                  color: withAlpha(
                    presentation.color && !many
                      ? presentation.color
                      : (theme.series[index % theme.series.length] ?? ''),
                    0.15,
                  ),
                },
              }
            : {}),
          data: series.points.map((point) => [point.t.getTime(), point.value]),
          ...(index === 0 && presentation.thresholds.length > 0
            ? {
                markLine: {
                  silent: true,
                  symbol: 'none',
                  label: { show: false },
                  data: presentation.thresholds.map((threshold) => ({
                    yAxis: threshold.value,
                    lineStyle: { color: threshold.color, type: 'dashed', width: 1 },
                  })),
                },
              }
            : {}),
        })),
      };
    },
    [presentation, result],
  );

  return <EChart option={option} label={`${presentation.title} chart`} />;
}
