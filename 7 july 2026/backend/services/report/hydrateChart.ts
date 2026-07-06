import {
    getChartData,
    getProductionChartData,
    getTimelineChartData,
} from "../queryEngine.ts";

import { buildChartOption } from "../../utils/buildChartOption.ts";
import { resolveChartSize } from "./chartSize.ts";
import { renderChartImage } from "./renderChartImage.ts";

export async function hydrateChart(node: any){
        if(node.props.chartType === "productionChart"){
            node.data = await getProductionChartData(node.props.config);
        }else if(node.props.chartType === "timeline"){
            const result = await getTimelineChartData(node.props.config);
            node.data = result.segments;
        }else{
            node.data = await getChartData(node.props.config);
        }

        const option = buildChartOption(
            node.props,
            node.data,
        );
        option.animation = false;

        const {width, height} =resolveChartSize(node.props.style)
        node.imageBuffer = await renderChartImage(option,width, height)
        node.imageCid = `chart-${node.id}`;
        console.log(node.imageCid);
        return node
}

