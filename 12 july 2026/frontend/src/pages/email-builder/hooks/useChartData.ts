import { useEffect, useState } from "react";
import { getChartData, getProductionChartData, getTimelineChartData } from "../services/api";
import type { ChartPoint } from "../types/chart";

export function useChartData(chartType:string, deviceId: string,metric: string, secondaryMetric:string, range:string, aggregation:string, timeBucket:string, dailyTimeFilterEnabled:boolean, dailyStartTime:string, dailyEndTime:string, productType:string) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => { 
    if (!deviceId) return;
    
    if (chartType === "productionChart") {
      getProductionChartData(deviceId, range, aggregation,dailyTimeFilterEnabled, dailyStartTime, dailyEndTime, productType, timeBucket).then((data) => { 
        setChartData(data);
      }).catch((err) => {
          console.error("Production fetch failed:", err);
      });
    }
    else if (chartType === "timeline"){
      getTimelineChartData(deviceId, range, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime, productType).then((data) => { 
        setChartData(data.segments);
      }).catch((err) => {
          console.error("Production fetch failed:", err);
      });
  
    }
    else {
      if(!metric) return;

      getChartData(deviceId, metric, secondaryMetric, range, aggregation, timeBucket, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime).then((data) => {
          setChartData(data);
      })      
    }

    }, [chartType,deviceId, metric, secondaryMetric,range, aggregation, timeBucket, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime, productType]);

  return chartData;
}