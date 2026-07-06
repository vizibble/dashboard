import type { aggregationMethod, timeBucket, ChartRange } from "../types/chartQuery.ts";

export function getAggregationExpression(
  aggregation: aggregationMethod
): string {
  switch (aggregation) {
    case "sum":
      return "SUM";

    case "avg":
      return "AVG";

    case "min":
      return "MIN";

    case "max":
      return "MAX";

    case "count":
      return "COUNT";

    default:
      return "None";
  }
}

export function getTimeBucketExpression(timeBucket:timeBucket):string{
      switch (timeBucket) {
    case "second":
      return "second";
    case "minute":
      return "minute";
    case "hour":
      return "hour";
    case "day":
      return "day";
    case "week":
      return "week";
    case "month":
      return "month";
    case "quarter":
      return "quarter";
    case "year":
      return "year";
    default:
      return "hour";
  }
}

export function getIntervalExpression(range:ChartRange):string{
switch (range) {
    case "last_1_hour":
        return "1 hour";
    case "last_3_hours":
        return "3 hours";
    case "last_6_hours":
        return "6 hours";
    case "last_12_hours":
        return "12 hours"; 
    case "last_24_hours":
        return "24 hours";
    case "last_7_days":
        return "7 days";
    case "last_15_days":
      return"15 days";
    case "last_30_days":
        return "30 days";
    case "last_90_days":
        return "90 days";
    case "last_180_days":
        return "180 days";
    case "last_365_days":
        return "365 days";
    default:
        return "24 hours";
  }
}