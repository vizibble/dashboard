import PropertySection from "./propertiesSection";
import PropertyField from "./PropertyField";
import AppearanceSection from "./AppearenceSection";
import BlockActions from "./BlockActions";
import CheckboxInput from "./CheckBoxInput";

interface DateTimePropertiesProps{
    selectedBlock: any;

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;

    updateNodeStyle:(
        id: number,
        text: string,
        value: string|number
        ) => void;  

    deleteNode: (nodeId:number) => void;

    moveNode: (parentContainerId:number, fromIndex:number, toIndex:number) => void;

    parentId: number;

    index: number;

    isFirst: boolean;

    isLast: boolean;
}

function DateTimeProperties({selectedBlock, updateNodeProp, moveNode, deleteNode, parentId, index, isFirst, isLast, updateNodeStyle}:DateTimePropertiesProps){
return(

          <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">
            <PropertySection title="Date Properties">
                <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />
            <PropertyField label="Date">
                <CheckboxInput label="Date"
                    checked={selectedBlock.props.date}
                    onChange={(e) =>updateNodeProp(selectedBlock.id,"date",e.target.checked)}
                />                
            </PropertyField>

            <PropertyField label="Time">
                <CheckboxInput label="Time"
                    checked={selectedBlock.props.time}
                    onChange={(e) =>
                        updateNodeProp(selectedBlock.id,"time",e.target.checked)}
                />                
            </PropertyField>            


            <PropertySection title="Appearance">

            <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} marginAvailable={true} heightChangeAllowed={false} typographyAvailable={true}/>
            </PropertySection>
                    
            </PropertySection>

          </aside>        

)
}

export default DateTimeProperties;