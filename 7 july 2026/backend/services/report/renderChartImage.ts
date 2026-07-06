import * as echarts from "echarts";
import { createCanvas } from "canvas";

export async function renderChartImage(option: any, width:number, height:number) {

    const canvas = createCanvas(width, height);
    const chart = echarts.init(canvas as any, null, {
        renderer: "canvas",
        width,
        height,
    });   
    chart.setOption(option);     
    const image = canvas.toBuffer("image/png");

    chart.dispose();

    return image;

}