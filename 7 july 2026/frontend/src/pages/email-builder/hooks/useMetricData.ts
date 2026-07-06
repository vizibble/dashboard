import { useEffect, useState } from "react";
import { getMetricData, getProductionMetricData } from "../services/api";

export function useMetricData(config: any) {

    const [metricValue, setMetricValue] = useState<number | null>(null);

    useEffect(() => {

        if (!config.deviceId) {
            return;
        }
        
        if (config.dataType === "production") {
               getProductionMetricData(config).then((data) => {
                    setMetricValue(data.value);
                });
        } else {
            if(!config.metric) return;
            getMetricData(config).then((data) => {
                setMetricValue(data.value);
            }); 
        }

       

    }, [
        config.deviceId,
        config.metric,
        config.aggregation,
        config.range,
        config.dailyTimeFilterEnabled,
        config.dailyStartTime,
        config.dailyEndTime,
        config.productType
    ]);

    return metricValue;
}