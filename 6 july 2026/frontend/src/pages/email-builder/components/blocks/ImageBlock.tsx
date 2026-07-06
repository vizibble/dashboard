import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";


interface ImageBlockProps{
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

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;    
}

function ImageBlock({block, index, selectedContainerId, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, deleteNode, updateNodeProp}:ImageBlockProps){
  const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
  const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
  const [isHovered, setIsHovered] = useState(false);

    return(
<div className="transition-shadow duration-150"
  ref={(node)=>{
    setNodeRef(node);
    setDropRef(node);
  }}
  style={{
    position:"relative",
    padding:block.props.style.padding,
    marginBottom:block.props.style.marginBottom,
    marginTop:block.props.style.marginTop,
    width: block.props.style.width,
    height: "auto"
  }}
  onMouseEnter={() => {setIsHovered(true)}}
  onMouseLeave={()=>{setIsHovered(false)}}
>
  <img
    src={block.props.src}
    alt={block.props.alt}
    width="100%"
    height="auto"
    draggable = {false}
    onClick={(e)=>{
      e.stopPropagation();
      setSelectedBlockId(block.id);
      setSelectedContainerId(parentContainerId);
    }}
    onLoad={(e) => {
      const img = e.currentTarget;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      // console.log(aspectRatio);
      updateNodeProp(
          block.id,
          "aspectRatio",
          img.naturalWidth / img.naturalHeight
      );
    }}    
  />

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


export default ImageBlock;