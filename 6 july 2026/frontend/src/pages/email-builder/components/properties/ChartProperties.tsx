import { useEffect, useState } from "react";
import { getDeviceMetrics, getDeviceProductTypes, getDevices } from "../../services/api";
import BlockActions from "./BlockActions";
import DataSection from "./chart/DataSection";
import TimeSection from "./chart/TimeSection";
import FilterSection from "./chart/FilterSection";
import AppearanceSection from "./AppearenceSection";
import PropertySection from "./propertiesSection";


interface ChartPropertiesProps{
    selectedBlock:any;
    
    updateNodeStyle:(
        id: number,
        text: string,
        value: string|number
        ) => void;  

    updateConfig:(
        id: number,
        text: string,
        value: string|boolean|number|null
        ) => void;

    updateDevice:(
        chartId: number,
        deviceId: string,
        deviceName: string
    ) => void;
    
    deleteNode: (nodeId:number) => void;

    moveNode: (parentContainerId:number, fromIndex:number, toIndex:number) => void;

    parentId: number;

    index: number;

    isFirst: boolean;

    isLast: boolean;
}

function ChartProperties({selectedBlock, updateConfig, updateDevice, updateNodeStyle,deleteNode, moveNode, parentId, index, isFirst, isLast}:ChartPropertiesProps){

    const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const isProduction = selectedBlock.props.chartType == "productionChart"?true:false
    const isTimeline = selectedBlock.props.chartType == "timeline"?true:false
    const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);  

    useEffect(() => {
        getDevices().then(setDevices);
    }, []);

    useEffect(() => {
        const deviceId = selectedBlock?.props?.config?.deviceId;

        if (!deviceId) {
            return;
        }

        if (isProduction) {
            getDeviceProductTypes(deviceId)
                .then(setAvailableProductTypes);
        } else {
            getDeviceMetrics(deviceId)
                .then(setAvailableMetrics);
        }
    }, [
        selectedBlock?.props?.config?.deviceId,
        isProduction,
    ]);
    
    useEffect(() => {//set's 1st metric as default on load
        if (availableMetrics.length > 0 && !availableMetrics.includes(selectedBlock.props.config.metric)) {
            updateConfig(
                selectedBlock.id,
                "metric",
                availableMetrics[0]
            );}
    }, [availableMetrics, selectedBlock.id, selectedBlock.props.config.metric]);


    //console.log(selectedBlock.props.chartType)

    return (
        <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">
        <PropertySection title="ChartProperties">
        <DataSection availableProductTypes={availableProductTypes} isTimeline={isTimeline} showMetric={!isProduction && !isTimeline} selectedBlock={selectedBlock} devices={devices} availableMetrics={availableMetrics} updateConfig={updateConfig} updateDevice={updateDevice} showSecondaryMetric={true} showThreshold={!(isProduction || isTimeline)}/>        

        <TimeSection secondsMinutes = {!isProduction} showMetric={!isProduction} selectedBlock={selectedBlock} updateConfig={updateConfig} timeBuckedAvailable={!isTimeline} aggregationAvailable={!isTimeline}/>        

        <FilterSection selectedBlock={selectedBlock} updateConfig={updateConfig} />             
        </PropertySection>
       


        <PropertySection title="Appearance">
        <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} heightChangeAllowed={true} marginAvailable={true}/>
        </PropertySection>


        <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />
        </aside>
    );
}

export default ChartProperties;