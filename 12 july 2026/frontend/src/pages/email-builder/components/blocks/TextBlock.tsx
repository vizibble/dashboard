import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface TextBlockProps {
  block: any;

  index:number;

  selectedContainerId: null|number;

  setSelectedContainerId: (
    id: number | null
  ) => void;

  selectedBlockId: number | null;

  setSelectedBlockId: (
    id: number
  ) => void;

  updateNodeProp:(
    id: number,
    text: string,
    value: string|number
    ) => void;

  parentContainerId: number;

      deleteNode: (nodeId:number) => void;
}

function TextBlock({block, updateNodeProp,setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, deleteNode}:TextBlockProps){
  const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
  const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
  const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

  return (<div style={{
            width:block.props.style.width,
            height:block.props.style.height,
            padding: block.props.style.padding,
            marginBottom:block.props.style.marginBottom,
            marginTop:block.props.style.marginTop,                
            backgroundColor: block.props.style.backgroundColor,
            color: block.props.style.color,
            fontSize: block.props.style.fontSize,
            fontWeight: block.props.style.fontWeight,
            fontStyle: block.props.style.fontStyle,
            position:"relative",
            }}
  onMouseEnter={() => {setIsHovered(true)}}
  onMouseLeave={()=>{setIsHovered(false)}}
  >
    <p key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
    onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(parentContainerId);}}
          >{isEditing ? (
          <div
              contentEditable
              suppressContentEditableWarning
              onKeyDown={(e) => {
              if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                  }
              }}
              onBlur={(e) => {
                  updateNodeProp(
                      block.id,
                      "text",
                      e.currentTarget.textContent ?? ""
                  );
                  setIsEditing(false);
              }}        
          >
              {block.props.text}
          </div>
      ) : (
          <div
              onDoubleClick={() => setIsEditing(true)}
          >
              {block.props.text}
          </div>
      )}</p>
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

export default TextBlock;