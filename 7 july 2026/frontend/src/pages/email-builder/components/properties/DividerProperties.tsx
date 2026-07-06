import PropertySection from "./propertiesSection";
import AppearanceSection from "./AppearenceSection";
import BlockActions from "./BlockActions";

interface DividerPropertiesProps{
    selectedBlock: any;

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

function DividerProperties({selectedBlock, updateNodeStyle, moveNode, deleteNode, parentId, index, isFirst, isLast}:DividerPropertiesProps){
return(

          <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">

        <PropertySection title="Divider Properties">
        <PropertySection title="Appearance">

        <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} heightChangeAllowed={true} typographyAvailable={false} marginAvailable={true}/>
        </PropertySection>

        <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />
        </PropertySection>


          </aside>        

)
}

export default DividerProperties;