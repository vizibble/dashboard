export interface ChartQuery {
  deviceId: string;
  metric: string;
  secondaryMetric: string;
  aggregation: aggregationMethod;
  timeBucket: timeBucket;
  range:ChartRange;
  dailyTimeFilterEnabled:boolean;
  dailyStartTime:string;
  dailyEndTime:string;
}

export type aggregationMethod =
    | "none"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count";

export type timeBucket=
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "week"
    | "month"
    | "quarter"
    | "year";

export type ChartRange =
    |"last_3_hours"
    |"last_6_hours"
    |"last_12_hours"
    | "last_1_hour"
    | "last_24_hours"
    | "last_7_days"
    | "last_15_days"
    | "last_30_days"
    | "last_90_days"
    | "last_180_days"
    | "last_365_days";