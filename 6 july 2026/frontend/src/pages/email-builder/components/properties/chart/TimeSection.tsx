import PropertySection from "../propertiesSection";
import PropertyField from "../PropertyField";
import SelectInput from "../SelectInput";

interface TimeSectionProps {
    selectedBlock: any;

    updateConfig: (
        id: number,
        key: string,
        value: string|number|null|boolean
    ) => void;

    timeBuckedAvailable?:boolean;

    aggregationAvailable?:boolean;

    secondsMinutes?:boolean;

    showMetric?:boolean
}

function TimeSection({showMetric = true,selectedBlock, secondsMinutes=true,updateConfig, timeBuckedAvailable, aggregationAvailable}:TimeSectionProps){

    // if(!showMetric){
    //     updateConfig(selectedBlock.id, "aggresgation", "sum");
    // }
return(
        <PropertySection title="Time">
        <div>
        <PropertyField label="Range">
            <SelectInput value={selectedBlock.props.config.range} onChange={(e)=>{updateConfig(selectedBlock.id, "range", e.target.value)}}>
            <option value="last_1_hour">Last Hour</option> 
            <option value="last_3_hours">Last 3 Hours</option>
            <option value="last_6_hours">Last 6 Hours</option>  
            <option value="last_12_hours">Last 12 Hours</option>
            <option value="last_24_hours">Last 24 Hours</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_15_days">Last 15 Days</option>              
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_180_days">Last 180 Days</option> 
            <option value="last_365_days">Last 365 Days</option>
        </SelectInput>
        </PropertyField>

        </div>

        <div>
{aggregationAvailable && <PropertyField label="Aggregation">
        <SelectInput value={selectedBlock.props.config.aggregation} onChange={(e)=>{updateConfig(selectedBlock.id, "aggregation", e.target.value)}}>
            {showMetric && <option value="none">None</option>}
            <option value="sum" >Total</option>
            <option value="avg">Average</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
            {showMetric && <option value="count">Count</option>}
        </SelectInput>    
</PropertyField>}

        </div> 

        {timeBuckedAvailable && 
            <PropertyField label="Time Bucket">
        <SelectInput value={selectedBlock.props.config.timeBucket} onChange={(e)=>{updateConfig(selectedBlock.id, "timeBucket", e.target.value)}} disabled={selectedBlock.props.config.aggregation === "none"}>
            {secondsMinutes && <option value="second">Second</option>}
            {secondsMinutes && <option value="minute">Minute</option>}
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>            
        </SelectInput>                
            </PropertyField> }          
        </PropertySection>
)
}

export default TimeSection;