import PropertySection from "./propertiesSection";
import SidebarButton from "./SideBarButtons";
import AppearanceSection from "./AppearenceSection";
import {MoveLeft, MoveRight, Trash2} from "lucide-react";

interface ColumnPropertiesProps{
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

function ColumnProperties({selectedBlock, updateNodeStyle,moveNode, deleteNode, parentId, index, isFirst, isLast}:ColumnPropertiesProps){
return(

        <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">
        <PropertySection title="Coulmn Properties">
            <div className="flex flex-col gap-[4px] w-full items-center">
            <SidebarButton onClick={() => moveNode(parentId, index, index-1)} isFirst icon={MoveLeft}>
              Move Left
            </SidebarButton>

            <SidebarButton onClick={() => moveNode(parentId, index, index+1)} isLast icon={MoveRight}>
              Move Right
            </SidebarButton>

            <SidebarButton onClick={() => {deleteNode(selectedBlock.id)}} icon={Trash2}>Delete Item</SidebarButton>              
            </div>
            <PropertySection title="Appearance">
            <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} heightChangeAllowed={true} typographyAvailable={false} marginAvailable={true}/>
            </PropertySection>
        </PropertySection>

          </aside>        

)
}

export default ColumnProperties;