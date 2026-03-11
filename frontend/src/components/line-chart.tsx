import { forwardRef } from 'react';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

import { useDefaultOptions } from '@/hooks/load-default-options';

type Props = {
  options: EChartsOption;
  height: string;
};

export const LineChart = forwardRef<ReactECharts, Props>(
  ({ options, height }, ref) => {
    const chartOptions = useDefaultOptions(options);

    return (
      <ReactECharts
        ref={ref}
        option={chartOptions}
        style={{ height: height }}
        notMerge
        lazyUpdate
      />
    );
  }
);

LineChart.displayName = 'LineChart';
