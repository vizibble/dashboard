import { forwardRef } from 'react';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

type Props = {
  options: EChartsOption;
  height: string;
};

export const BarChart = forwardRef<ReactECharts, Props>(
  ({ options, height }, ref) => {
    return (
      <ReactECharts
        ref={ref}
        lazyUpdate
        notMerge={false}
        style={{ height: height }}
        option={options}
      />
    );
  }
);

BarChart.displayName = 'BarChart';
