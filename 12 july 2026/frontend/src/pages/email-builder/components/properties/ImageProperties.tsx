import PropertySection from "./propertiesSection";
import PropertyField from "./PropertyField";
import AppearanceSection from "./AppearenceSection";
import BlockActions from "./BlockActions";
import TextInput from "./TextInput";

interface ImagePropertiesProps{
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

function ImageProperties({selectedBlock, updateNodeProp, updateNodeStyle, moveNode, deleteNode, parentId, index, isFirst, isLast}:ImagePropertiesProps){
return(

<aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">
    <PropertySection title="Image Properties">
        <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />        
    <PropertyField label="Source">
            <TextInput
                value={selectedBlock.props.src}
                onChange={(e) =>
                updateNodeProp(
                    selectedBlock.id,
                    "src",
                    e.target.value
                )
                }
            />        
    </PropertyField>

        <PropertySection title="Appearance">

        <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} heightChangeAllowed={true} typographyAvailable={false} marginAvailable={true}/>
        </PropertySection>

    </PropertySection>
</aside>        

)
}

export default ImageProperties;