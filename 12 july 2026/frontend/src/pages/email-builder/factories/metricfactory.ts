import type { MetricBlock } from "../types/blocks";
import { createNode } from "./blockFactory";

const style = {
        width: "100%",
        padding: 12,
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: 16,
        fontWeight: "normal",
        fontStyle: "normal"}

export const createMetric = (deviceId:string, deviceName:string):MetricBlock => createNode("metric",
     {config: 
        {deviceId: deviceId,
         deviceName: deviceName,
         dataType: "telemetry",
         metric: "",
         aggregation: "avg",
         range: "last_24_hours",
         rangeMode: "relative",
         dailyTimeFilterEnabled: false,
         dailyStartTime: "09:00",
         dailyEndTime: "13:00",
         productType:"all",},
      style});