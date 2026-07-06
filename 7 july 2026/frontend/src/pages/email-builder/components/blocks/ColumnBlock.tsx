import BlockRenderer from "./BlockRenderer";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface ColumnBlockProps{
    block: any;

    index:number;

    selectedContainerId: null|number;

    setSelectedContainerId: (
        id: number | null
    ) => void;

    selectedBlockId: number | null;

    setSelectedBlockId:(id:number|null) => void;

    parentContainerId: number;

    updateNodeStyles:(
    id: number,
    width:string|number,
    height:string|number
    ) => void; 

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;
    
    deleteNode: (nodeId:number) => void;
}

function ColumnBlock({block, index, selectedContainerId, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, updateNodeStyles, deleteNode, updateNodeProp}:ColumnBlockProps){
    
  const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
  const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
  const [isHovered, setIsHovered] = useState(false);

    return(
    <div key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
      onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(block.id); 
      }}
      style={{
        minHeight: "50px",
        display: "flex",
        flex: 1,
        flexDirection:"column",
        gap:"2px",
        width: block.props.style.width,
        height: block.props.style.height,
        padding: block.props.style.padding,
        backgroundColor: block.props.style.backgroundColor,
        color: block.props.style.color,
        boxShadow:selectedBlockId === block.id
        ? "0 0 0 2px #2563eb"
        : undefined,
        position:"relative",
        border:"1px solid lightgray" 
      }}
  onMouseEnter={() => {setIsHovered(true)}}
  onMouseLeave={()=>{setIsHovered(false)}}

    >
      {block.children.map((child: any, index:number) => (
        <BlockRenderer
        key={block.id}
            block={child}
            index = {index}
            selectedContainerId={selectedContainerId}
            setSelectedContainerId={setSelectedContainerId}
            selectedBlockId={selectedBlockId}
            setSelectedBlockId={setSelectedBlockId}
            parentContainerId={block.id}
            updateNodeStyles={updateNodeStyles}
            deleteNode={deleteNode}
            updateNodeProp={updateNodeProp}
        />
        ))}
<button
    onClick={(e) => {
        e.stopPropagation();
        deleteNode(block.id);
    }}
    style={{
        position: "absolute",
        bottom: 8,
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
      bottom: 8,
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

export default ColumnBlock;