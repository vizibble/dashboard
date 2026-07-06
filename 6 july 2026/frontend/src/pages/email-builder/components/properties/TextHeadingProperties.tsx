import PropertySection from "./propertiesSection";
import PropertyField from "./PropertyField";
import AppearanceSection from "./AppearenceSection";
import BlockActions from "./BlockActions";
import TextInput from "./TextInput";

interface TextHeadingPropertiesProps{
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

function TextHeadingProperties({selectedBlock, updateNodeProp, moveNode, deleteNode, parentId, index, isFirst, isLast, updateNodeStyle}:TextHeadingPropertiesProps){
return(

          <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">
            <PropertySection title="Text Properties">
            <PropertyField label="Text">
            <TextInput
                value={selectedBlock.props.text}
                onChange={(e) =>
                updateNodeProp(
                    selectedBlock.id,
                    "text",
                    e.target.value
                )
                }
            />                
            </PropertyField>


            <PropertySection title="Appearance">

            <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} marginAvailable={true} heightChangeAllowed={false} typographyAvailable={true}/>
            </PropertySection>
                    
            <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />
            </PropertySection>

          </aside>        

)
}

export default TextHeadingProperties;