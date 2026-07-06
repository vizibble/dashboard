
import type { ChartPoint, ChartProps } from "../types/chart";
import { formatMetricName } from "./chartFrmatting";
import { formatXAxisLabel } from "./formatXAxisLabel";
import { buildTimelineOption } from "./buildTimelineOption";
import { buildProductionOption } from "./buildProductionOptions";

export const buildChartOption = (
  chartProps: ChartProps,
  chartData: ChartPoint[]
) => {

    if (
        !Array.isArray(chartData) ||
        chartData.length === 0
    ) {
        return {};
    }

    if (
        !chartProps ||
        !chartProps.config ||
        !chartProps.chartType
    ) {
        return {};
    }    

    if (chartProps.chartType === "timeline") {

      return buildTimelineOption(chartData);
    }  


    if (chartProps.chartType == "productionChart"){

      return buildProductionOption(chartProps, chartData);
    }

    const validChartData = chartData.filter(
        (item) =>
            item &&
            item.time != null &&
            item.value != null
    );
    if (validChartData.length === 0) {
        return {};
    }


  const xAxisData = validChartData.map((item: ChartPoint) => 
    formatXAxisLabel(
        new Date(item.time),
        chartProps.config.range,
        chartProps.config.aggregation,
        chartProps.config.timeBucket
  ));
  const title = (chartProps.config.secondaryMetric === "none")?chartProps.config.deviceName+" - "+formatMetricName(chartProps.config.metric):chartProps.config.deviceName+" - "+formatMetricName(chartProps.config.metric)+" vs "+formatMetricName(chartProps.config.secondaryMetric);
  const primaryMetricData = validChartData.map((item: ChartPoint) =>{
    const value = Number(item.value);
    const point = {value,};
    if (chartProps.config.maxThreshold !== null && value > chartProps.config.maxThreshold) {
            point.itemStyle = {
                color: "#e74c3c",
            };
        }

        if (chartProps.config.minThreshold !== null && value < chartProps.config.minThreshold
        ) {
            point.itemStyle = {
                color: "#3498db",
            };
        }    
    return point
  })
  let secondaryMetricData:any[] =[];
  if(chartProps.config.secondaryMetric !== 'none'){
    secondaryMetricData = validChartData.map((item: ChartPoint) => {const value = Number(item.secondaryvalue!);
    const point = {value,};
    if (chartProps.config.maxThreshold !== null && value > chartProps.config.maxThreshold) {
            point.itemStyle = {
                color: "#e74c3c",
            };
        }

        if (chartProps.config.minThreshold !== null && value < chartProps.config.minThreshold
        ) {
            point.itemStyle = {
                color: "#3498db",
            };
        }    
    return point      
    });
  }
  const thresholdLines = [];
  if (chartProps.config.minThreshold !== null) {
      thresholdLines.push({
          yAxis: chartProps.config.minThreshold,
          label:{
            formatter:"Min"
          },
          lineStyle:{
            color:"#3498db"
          }
      });
  }

  if (chartProps.config.maxThreshold !== null) {
      thresholdLines.push({
          yAxis: chartProps.config.maxThreshold,
          label:{
            formatter:"Max"
          },
          lineStyle:{
            color:"#e74c3c"
          }
      });
  }
  const baseConfig = {
      xAxis: {type: "category",data: xAxisData,name: chartProps.config.xAxisLabel||"Time",axisLabel:{hideOverlap:true,rotate: xAxisData.length > 15 ? 45 : 0,}},
      yAxis: {type: "value",name: chartProps.config.yAxisLabel||formatMetricName(chartProps.config.metric),}, 
      title: {text: title,left:"center"}, 
      tooltip: {trigger: "axis", axisPointer:{type:"cross"}, valueFormatter:(value:unknown)=>{const num = Number(value); if(!Number.isNaN(num)){return num.toFixed(2)} return String(value)}}, 
      grid: {left: 60,right: 20,top: 50,bottom: 70},
      legend:{show:true,bottom:0, left:"center", icon: "roundRect"},
      // visualMap: chartProps.config.maxThreshold !== null
      //     ? {
      //         show: false,
      //         dimension: 1,
      //         pieces: [
      //             {
      //                 gt: chartProps.config.maxThreshold,
      //                 color: "#e74c3c",
      //             },
      //             {
      //                 lte: chartProps.config.maxThreshold,
      //             },
      //         ],
      //     }
      //     : undefined,      
    }; 

  if(chartProps.chartType === "line"){
      const seriesData = [{
        data: primaryMetricData, type:"line", smooth:false, name:formatMetricName(chartProps.config.metric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
      }]

      if(chartProps.config.secondaryMetric && chartProps.config.secondaryMetric !== "none"){
        seriesData.push({
          data: secondaryMetricData, type:"line", smooth:false, name: formatMetricName(chartProps.config.secondaryMetric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
        })
      }

      return {...baseConfig, series:seriesData}
  }

  if(chartProps.chartType === "area"){
      const seriesData = [{
        data: primaryMetricData, type:"line", smooth:true, areaStyle:{}, name:formatMetricName(chartProps.config.metric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
      }]

      if(chartProps.config.secondaryMetric && chartProps.config.secondaryMetric !== "none"){
        seriesData.push({
          data: secondaryMetricData, type:"line", smooth:true, areaStyle:{}, name:formatMetricName(chartProps.config.secondaryMetric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
        })
      }

    return {...baseConfig, series:seriesData}
  }

  if(chartProps.chartType === "bar"){
      const seriesData = [{
        data: primaryMetricData, type:"bar", smooth:false, name:formatMetricName(chartProps.config.metric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
      }]

      if(chartProps.config.secondaryMetric && chartProps.config.secondaryMetric !== "none"){
        seriesData.push({
          data: secondaryMetricData, type:"bar", smooth:false, name: formatMetricName(chartProps.config.secondaryMetric), markLine: {silent: true, data: thresholdLines, symbol:"none", label:{show:true}, lineStyle:{type:"dashed", width:2}},
        })
      }
          
    return {...baseConfig, series:seriesData}
  }

console.warn(
    `Unsupported chart type: ${chartProps.chartType}`
);

return {};


};

