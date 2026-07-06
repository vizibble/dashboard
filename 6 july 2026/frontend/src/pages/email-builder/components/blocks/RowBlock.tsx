import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import BlockRenderer from "./BlockRenderer";
import { useState } from "react";

interface RowBlockProps{
    block: any;

    index: number;

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

function RowBlock({block, index, selectedContainerId, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, updateNodeStyles, deleteNode, updateNodeProp}:RowBlockProps){
  const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
  const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});


  return(
      <div key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}} className="transition-shadow duration-150"
        onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(block.id); 
        }}
      
        style={{
          position:"relative",
          minHeight: "120px",
          display: "flex",
          flexDirection:"row",
          gap:"2px",
          boxShadow:selectedBlockId === block.id
          ? "0 0 0 2px #2563eb"
          : undefined,
          width:block.props.style.width,
          height:block.props.style.height,
          padding: block.props.style.padding,
          marginBottom:block.props.style.marginBottom,
          marginTop:block.props.style.marginTop,            
          backgroundColor: block.props.style.backgroundColor,
          color: block.props.style.color,
          border:"1px solid lightgray"             
    }}
      >
        {block.children.map((child: any, index:number) => (
          <BlockRenderer
              block={child}
              index={index}
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
      </div>
    );
}

export default RowBlock;