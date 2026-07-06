import CheckboxInput from "../CheckBoxInput";
import PropertySection from "../propertiesSection";
import PropertyField from "../PropertyField";
import TimeInput from "../TimeInput";

interface FilterSectionProps{
    selectedBlock:any;
    updateConfig:(chartId:number, configName:string, value:string|boolean|number|null)=>void;
}

function FilterSection({selectedBlock, updateConfig}:FilterSectionProps){
return(
<PropertySection title="Filter">
    <div>
        
            <CheckboxInput label="Daily Time Filter"
                checked={selectedBlock.props.config.dailyTimeFilterEnabled}
                onChange={(e) =>
                    updateConfig(selectedBlock.id,"dailyTimeFilterEnabled",e.target.checked)
                }
            />        
    
    </div>

    <div>
        <PropertyField label="Start Time">
        <TimeInput
            value={selectedBlock.props.config.dailyStartTime}
            disabled={
                !selectedBlock.props.config.dailyTimeFilterEnabled
            }
            onChange={(e) =>
                updateConfig(
                    selectedBlock.id,
                    "dailyStartTime",
                    e.target.value
                )
            }
        />            
        </PropertyField>


    </div>

    <div>
        <PropertyField label="End Time">
        <TimeInput
            value={selectedBlock.props.config.dailyEndTime}
            disabled={
                !selectedBlock.props.config.dailyTimeFilterEnabled
            }
            onChange={(e) =>
                updateConfig(
                    selectedBlock.id,
                    "dailyEndTime",
                    e.target.value
                )
            }
        />            
        </PropertyField>


    </div>
</PropertySection>    
)
}

export default FilterSection;