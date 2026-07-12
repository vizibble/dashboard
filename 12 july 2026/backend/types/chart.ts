export interface ChartDataPoint {
  [key: string]: string | number;
}

export type ChartType = 
  |"line"
  |"area"
  |"bar"
  |"productionChart"
  |"timeline"

export interface ChartPoint {
    time: string;
    value: number;
    secondaryvalue?: number;
}

export type ChartRange =
    | "last_24_hours"
    | "last_7_days"
    | "last_15_days"
    | "last_30_days"
    | "last_90_days"
    | "last_180_days"
    | "last_365_days";

export type ChartRangeMode =
  |"absolute"
  |"relative";

export interface ChartConfig {
  metric: string;

  productType:string;

  secondaryMetric: string;

  xAxisLabel: string;

  yAxisLabel: string;

  aggregation:aggregation;

  timeBucket:timeBucket;

  range: ChartRange;

  rangeMode:ChartRangeMode;

  dailyTimeFilterEnabled: boolean;

  dailyStartTime: string;

  dailyEndTime: string;

  deviceId: string;

  deviceName: string;

  dataType:string;

  minThreshold: number|null;

  maxThreshold: number|null;
}

export interface ChartProps {
  chartType: ChartType;

  config: ChartConfig;

  style?:any
}

export type aggregation =
    |"none"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count";

export type timeBucket = 
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "week"
    | "month"
    | "quarter"
    | "year";