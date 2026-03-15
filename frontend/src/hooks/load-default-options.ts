import { useMemo } from 'react';

import type { EChartsOption, LineSeriesOption, SeriesOption } from 'echarts';

import {
  DEFAULT_DATA_ZOOM,
  DEFAULT_GRID,
  DEFAULT_LINE_STYLE,
  DEFAULT_TOOLTIP,
  DEFAULT_X_AXIS,
  DEFAULT_Y_AXIS,
} from '@/constants/line-chart-style';

export const useDefaultOptions = (options: EChartsOption) => {
  return useMemo(() => {
    // Normalise series to an array regardless of how the consumer provides it
    const rawSeries: SeriesOption[] = Array.isArray(options.series)
      ? options.series
      : options.series
        ? [options.series]
        : [];

    const mergedSeries = (rawSeries as LineSeriesOption[]).map((s) => ({
      ...DEFAULT_LINE_STYLE,
      ...s,
    }));

    return {
      ...options,
      series: mergedSeries,
      tooltip: {
        ...DEFAULT_TOOLTIP,
        ...options.tooltip,
      },
      grid: {
        ...DEFAULT_GRID,
        ...options.grid,
      },
      xAxis: {
        ...DEFAULT_X_AXIS,
        ...options.xAxis,
      },
      yAxis: {
        ...DEFAULT_Y_AXIS,
        ...options.yAxis,
      },
      dataZoom: options.dataZoom || DEFAULT_DATA_ZOOM,
      backgroundColor: 'transparent',
    } as EChartsOption;
    // JSON.stringify is used to deep-compare options so the memo
    // re-computes only when the data actually changes, not on every render
    // due to object reference churn from inline option literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);
};
