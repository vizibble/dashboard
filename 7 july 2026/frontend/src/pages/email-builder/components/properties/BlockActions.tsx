import SidebarButton from "./SideBarButtons";

import {MoveUp, MoveDown, Trash2} from "lucide-react";

interface BlockActionsProps{
    selectedBlock:any;

    deleteNode: (nodeId:number) => void;

    moveNode: (parentContainerId:number, fromIndex:number, toIndex:number) => void;

    parentId: number;

    index: number;

    isFirst: boolean;

    isLast: boolean;    
}

function BlockActions({selectedBlock, moveNode, deleteNode, parentId, index, isFirst, isLast}:BlockActionsProps){
    return (
        <div className="flex flex-col gap-[4px] w-full items-center">
            <SidebarButton onClick={() => moveNode(parentId, index, index-1) } isFirst={isFirst} icon={MoveUp}>
                Move Up
            </SidebarButton>

            <SidebarButton onClick={() => moveNode(parentId, index, index+1)} isLast={isLast} icon={MoveDown}>
                Move Down
            </SidebarButton>

            <SidebarButton onClick={() => {deleteNode(selectedBlock.id)}} icon={Trash2}>Delete Item</SidebarButton>            
        </div>
    )
}

export default BlockActions;