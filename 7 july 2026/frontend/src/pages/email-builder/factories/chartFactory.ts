import type { ChartProps, ChartType } from "../types/chart";
import { createNode } from "./blockFactory";

const style = {
        width: "100%",
        height:"300px",
        padding: 12,
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: 16,
        fontWeight: "normal",
        fontStyle: "normal"}

export const createChart = (type:ChartType, deviceId:string, deviceName:string) => {
    const chartProps: ChartProps = {
      chartType: type,

      config:{metric:"",
              secondaryMetric: "none",              
              xAxisLabel:"",
              yAxisLabel:"",
              dataType: "telemetry",
              productType:"all",
              timeBucket:"day",
              range:"last_24_hours",//absolute, satrt, end
              rangeMode:"relative",
              dailyTimeFilterEnabled:false,
              dailyStartTime:"09:00",
              dailyEndTime:"13:00",
              aggregation:(type == "productionChart"?"sum":"none"),
              deviceId:deviceId,
              deviceName:deviceName,
              minThreshold: null,
              maxThreshold: null,
            },
      style
      
    };

    return createNode("chart", chartProps);
}

