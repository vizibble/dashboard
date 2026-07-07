import PropertySection from "./propertiesSection";
import SidebarButton from "./SideBarButtons";
import AppearanceSection from "./AppearenceSection";
import {MoveUp, MoveDown, Trash2} from "lucide-react";

interface SectionPropertiesProps{
    selectedBlock:any;   
    
    updateNodeStyle: (
        id: number,
        styleName: string,
        value: string|number
    ) => void;    

    moveSection: (fromIndex:number, toIndex: number) => void;

    deleteNode: (nodeId:number) => void;

    index: number;

    isFirst: boolean;

    isLast: boolean;    
}

function SectionProperties({selectedBlock,moveSection,deleteNode, index, isFirst, isLast, updateNodeStyle}:SectionPropertiesProps){
    return(
<aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">


<PropertySection title="Section Properties">
            <div className="flex flex-col gap-[4px] w-full items-center">

            <SidebarButton onClick={() => moveSection(index, index-1)} isFirst={isFirst} icon={MoveUp}>
              Move Up
            </SidebarButton>

            <SidebarButton onClick={() => moveSection(index, index+1)} isLast={isLast} icon={MoveDown}>
              Move Down
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

export default SectionProperties;