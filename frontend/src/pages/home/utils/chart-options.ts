import type { EChartsOption } from 'echarts';

export const getTemperatureOptions = (data: {
  times: string[];
  temperatureData: number[];
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: 20,
    max: 80,
  },
  series: [
    {
      name: 'Temperature',
      data: data.temperatureData,
      tooltip: {
        valueFormatter: (value: unknown) => `${value} °C`,
      },
    },
  ],
});

export const getHumidityOptions = (data: {
  times: string[];
  humidityData: number[];
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: 0,
    max: 100,
  },
  series: [
    {
      name: 'Humidity',
      data: data.humidityData,
      tooltip: {
        valueFormatter: (value: unknown) => `${value} %RH`,
      },
    },
  ],
});

export const getPressureOptions = (data: {
  times: string[];
  differentialPressureData: number[];
}): EChartsOption => ({
  xAxis: {
    data: data.times,
  },
  yAxis: {
    min: -50,
    max: 50,
  },
  series: [
    {
      name: 'Pressure',
      data: data.differentialPressureData,
      tooltip: {
        valueFormatter: (value: unknown) => `${value} Pa`,
      },
    },
  ],
});
