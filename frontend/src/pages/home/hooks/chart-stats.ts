import { useMemo } from 'react';

import type { LineSeriesOption } from 'echarts';

import { getSeriesStats } from '@/pages/home/utils/get-series-stats';

export const useChartStats = (series?: LineSeriesOption) => {
  return useMemo(() => {
    const raw = series?.data ?? [];
    return getSeriesStats(raw as unknown[]);
  }, [series?.data]);
};
