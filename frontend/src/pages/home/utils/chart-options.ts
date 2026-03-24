import type { EChartsOption, SeriesOption } from 'echarts';

interface Thresholds {
  min?: number;
  max?: number;
}

export const getTemperatureOptions = (data: {
  times: string[];
  temperatureData: number[];
  thresholds?: Thresholds;
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: 15,
    max: 40,
  },
  visualMap: getVisualMap(data.thresholds?.min, data.thresholds?.max),
  series: [
    {
      name: 'Temperature',
      data: data.temperatureData,
      areaStyle: {
        opacity: 0.1,
      },
      tooltip: {
        valueFormatter: (value: unknown) => `${value} °C`,
      },
      markLine: getMarkLine(data.thresholds?.min, data.thresholds?.max),
    },
  ],
});

export const getHumidityOptions = (data: {
  times: string[];
  humidityData: number[];
  thresholds?: Thresholds;
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: 0,
    max: 100,
  },
  visualMap: getVisualMap(data.thresholds?.min, data.thresholds?.max),
  series: [
    {
      name: 'Humidity',
      data: data.humidityData,
      areaStyle: {
        opacity: 0.1,
      },
      tooltip: {
        valueFormatter: (value: unknown) => `${value} %RH`,
      },
      markLine: getMarkLine(data.thresholds?.min, data.thresholds?.max),
    },
  ],
});

const getVisualMap = (
  min?: number,
  max?: number
): EChartsOption['visualMap'] => {
  if (min === undefined && max === undefined) return undefined;

  const pieces = [];
  if (max !== undefined) {
    pieces.push({
      gt: max,
      color: '#ef4444', // Red for above max
    });
  }
  if (min !== undefined && max !== undefined) {
    pieces.push({
      gt: min,
      lte: max,
      color: '#3b82f6', // Blue for normal range
    });
  } else if (max !== undefined) {
    pieces.push({
      lte: max,
      color: '#3b82f6',
    });
  } else if (min !== undefined) {
    pieces.push({
      gt: min,
      color: '#3b82f6',
    });
  }

  if (min !== undefined) {
    pieces.push({
      lte: min,
      color: '#ef4444', // Red for below min
    });
  }

  return {
    show: false,
    dimension: 1,
    pieces,
    outOfRange: {
      color: '#ef4444',
    },
  };
};
const getMarkLine = (
  min?: number,
  max?: number
): NonNullable<SeriesOption['markLine']> => {
  const data = [];
  if (max !== undefined) {
    data.push({
      yAxis: max,
      name: 'Upper Limit',
      lineStyle: { color: '#ef4444', type: 'dashed' },
      label: { formatter: 'Max: {c}', position: 'end' },
    });
  }
  if (min !== undefined) {
    data.push({
      yAxis: min,
      name: 'Lower Limit',
      lineStyle: { color: '#ef4444', type: 'dashed' },
      label: { formatter: 'Min: {c}', position: 'end' },
    });
  }
  return {
    symbol: ['none', 'none'],
    data,
  };
};
export const getPressureOptions = (data: {
  times: string[];
  differentialPressureData: number[];
  thresholds?: Thresholds;
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: -10,
    max: 10,
  },
  visualMap: getVisualMap(data.thresholds?.min, data.thresholds?.max),
  series: [
    {
      name: 'Pressure',
      data: data.differentialPressureData,
      areaStyle: {
        opacity: 0.1,
      },
      tooltip: {
        valueFormatter: (value: unknown) => `${value} Pa`,
      },
      markLine: getMarkLine(data.thresholds?.min, data.thresholds?.max),
    },
  ],
});
