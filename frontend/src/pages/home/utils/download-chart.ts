import type { RefObject } from 'react';

import type ReactECharts from 'echarts-for-react';

export const downloadChart = (
  chartRef: RefObject<ReactECharts | null>,
  title: string,
) => {
  const instance = chartRef.current?.getEchartsInstance();
  if (!instance) return;

  const url = instance.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "_")}.png`;
  link.click();
};
