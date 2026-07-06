import { hydrateChart } from "./hydrateChart.ts";
import { hydrateMetric } from "./hydrateMetric.ts";
 

async function hydrateNode(node: any): Promise<any> {

    const containerTypes = [
        "section",
        "row",
        "column",
    ];

    if (containerTypes.includes(node.type)) {

        for (const child of node.children) {
            await hydrateNode(child);
        }

    }

    if(node.type === "metric"){
        await hydrateMetric(node);
    }
    else if(node.type === "chart"){
        await hydrateChart(node);
    }

    return node;
}


export async function buildReportData(template: any) {

    for (const block of template.blocks) {
        await hydrateNode(block);
    }

    return template;

}

