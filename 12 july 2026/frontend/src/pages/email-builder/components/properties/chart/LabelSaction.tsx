import PropertySection from "../propertiesSection";

interface LabelSectionProps {
    selectedBlock: any;
    
    updateConfig: (
        id: number,
        key: string,
        value: string|number|null|boolean
    ) => void;
}

function LabelSection({selectedBlock, updateConfig}:LabelSectionProps){
return(
        <PropertySection title="Label">
        <div>
        <p>
            X Label:
        </p>
        <input value={selectedBlock.props.config.xAxisLabel}
            onChange={(e) =>
            updateConfig(
                selectedBlock.id,
                "xAxisLabel",
                e.target.value
            )
            }

        />
        </div> 
                    
        <div>
        <p>
            Y Label:
        </p>
        <input value={selectedBlock.props.config.yAxisLabel}
            onChange={(e) =>
            updateConfig(
                selectedBlock.id,
                "yAxisLabel",
                e.target.value
            )
            }

        />
        </div>             
        </PropertySection>
)
}

export default LabelSection;