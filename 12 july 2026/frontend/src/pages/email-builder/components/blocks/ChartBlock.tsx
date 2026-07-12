import { useDraggable, useDroppable } from "@dnd-kit/core";
import ReactECharts from "echarts-for-react";
import { buildChartOption } from "../../utils/buildChartOption";
import { useChartData } from "../../hooks/useChartData.ts";

import type { Chart } from "../../types/blocks.ts";
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { isEmptyChartOption } from "../../utils/isEmptyCHartOptions.ts";

interface ChartBlockProps {
    block: Chart;

    index: number;

    selectedContainerId: null|number;

    setSelectedContainerId: (
        id: number | null
    ) => void;

    selectedBlockId: number | null;

    setSelectedBlockId:(id:number) => void;

    parentContainerId: number;

    deleteNode: (nodeId:number) => void;    
}

function ChartBlock({ block, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, deleteNode}: ChartBlockProps) {
    const [isHovered, setIsHovered] = useState(false); 

    const chartData =  useChartData(block.props.chartType, block.props.config.deviceId, block.props.config.metric, block.props.config.secondaryMetric, block.props.config.range, block.props.config.aggregation, block.props.config.timeBucket, block.props.config.dailyTimeFilterEnabled,block.props.config.dailyStartTime, block.props.config.dailyEndTime, block.props.config.productType);
 
    
    const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
    const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
    
    const options = buildChartOption(block.props, chartData);

    if (isEmptyChartOption(options)) {
            return (
                <div key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
                onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(parentContainerId);}}
                style={{
                width: "100%",
                height: block.props.style.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#6b7280",
                backgroundColor: "#fafafa",
            }}
        onMouseEnter={() => {setIsHovered(true)}}
        onMouseLeave={()=>{setIsHovered(false)}}

                >
                    NO DATA TO SHOW
        <button
            onClick={(e) => {
                e.stopPropagation();
                deleteNode(block.id);
            }}
            style={{
                position: "absolute",
                top: 8,
                right: 44,

                opacity:
                    selectedBlockId === block.id ? 1 : 0,

                transition: "opacity 0.15s ease",

                background: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
        >
            <Trash2 size={18} />
        </button>  

        <span
            {...listeners}
            {...attributes}
            style={{
            position: "absolute",
            top: 8,
            right: 8,
            cursor: "grab",
            opacity: isHovered || selectedBlockId === block.id ? 1 : 0,
            transition: "opacity 0.15s ease",

            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"      
            }}
        >
            <GripVertical size={18} />
        </span>
                </div>
            );
}
    
    return (
        <div key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
        onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(parentContainerId);}}
        style={{
            minHeight: "150px",
            width: block.props.style.width,
            height: block.props.style.height,
            padding: block.props.style.padding,
            marginBottom:block.props.style.marginBottom,
            marginTop:block.props.style.marginTop,            
            backgroundColor: block.props.style.backgroundColor,
            color: block.props.style.color,
            fontSize: block.props.style.fontSize,
            fontWeight: block.props.style.fontWeight,
            fontStyle: block.props.style.fontStyle,
            position:"relative"
        }}
  onMouseEnter={() => {setIsHovered(true)}}
  onMouseLeave={()=>{setIsHovered(false)}}

        >
            <ReactECharts option={options}
            style={{height:"100%", width:"100%"}}
            notMerge={true} />
<button
    onClick={(e) => {
        e.stopPropagation();
        deleteNode(block.id);
    }}
    style={{
        position: "absolute",
        top: 8,
        right: 44,

        opacity:
            selectedBlockId === block.id ? 1 : 0,

        transition: "opacity 0.15s ease",

        background: "#fff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "6px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
>
    <Trash2 size={18} />
</button>  

  <span
    {...listeners}
    {...attributes}
    style={{
      position: "absolute",
      top: 8,
      right: 8,
      cursor: "grab",
      opacity: isHovered || selectedBlockId === block.id ? 1 : 0,
      transition: "opacity 0.15s ease",

      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      padding: "6px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"      
    }}
  >
    <GripVertical size={18} />
  </span>
        </div>
    );

}

export default ChartBlock;