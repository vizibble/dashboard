import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface DividerBlockProps{
    block: any;

    index:number;

    selectedContainerId: null|number;

    setSelectedContainerId: (
      id: number | null
    ) => void;

    selectedBlockId: number | null;

    setSelectedBlockId:(id:number) => void;

    parentContainerId: number;

        deleteNode: (nodeId:number) => void;
}

function DividerBlock({block, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, deleteNode}:DividerBlockProps){
    const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
    const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
    const [isHovered, setIsHovered] = useState(false);    
    return(
        <div style={{position:"relative"}} 
  onMouseEnter={() => {setIsHovered(true)}}
  onMouseLeave={()=>{setIsHovered(false)}}        
        ><div key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
        onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(parentContainerId);}} 
        style={{
            boxSizing:"border-box",
            height: block.props.style.height,
            backgroundColor:block.props.style.color,
            width:block.props.style.width,
            marginBottom:block.props.style.marginBottom,
            marginTop:block.props.style.marginTop,
        }}></div>
<button
    onClick={(e) => {
        e.stopPropagation();
        deleteNode(block.id);
    }}
    style={{
        position: "absolute",
        top: 8,
        right: 44,

        opacity:
            selectedBlockId === block.id ? 1 : 0,

        transition: "opacity 0.15s ease",

        background: "#fff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "6px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
>
    <Trash2 size={18} />
</button>  

  <span
    {...listeners}
    {...attributes}
    style={{
      position: "absolute",
      top: 8,
      right: 8,
      cursor: "grab",
      opacity: isHovered || selectedBlockId === block.id ? 1 : 0,
      transition: "opacity 0.15s ease",

      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      padding: "6px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"      
    }}
  >
    <GripVertical size={18} />
  </span>
        </div>
    );
}

export default DividerBlock;