import { useEffect } from 'react';

import type ReactECharts from 'echarts-for-react';

export const useChartResize = (
  chartRef: React.RefObject<ReactECharts | null>,
) => {
  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize();

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [chartRef]);
};
