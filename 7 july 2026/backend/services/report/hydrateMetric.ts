import { getMetricData, getProductionMetricData } from "../queryEngine.ts";

export async function hydrateMetric(node:any){
        if(node.props.config.dataType === "telemetry"){
            node.data = await getMetricData(node.props.config);
        }else if(node.props.config.dataType === "production"){
            node.data = await getProductionMetricData(node.props.config);
        }
}