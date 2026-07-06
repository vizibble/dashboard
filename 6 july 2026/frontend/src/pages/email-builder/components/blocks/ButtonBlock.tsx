import { useDraggable, useDroppable } from "@dnd-kit/core";

interface ButtonBlockProps{
    block: any;

    index: number;

    selectedContainerId: null|number;

    setSelectedContainerId: (
      id: number | null
    ) => void;

    selectedBlockId: number | null;

    setSelectedBlockId:(id:number) => void;

    parentContainerId: number;
}

function ButtonBlock({block, setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId}:ButtonBlockProps){
    const {attributes, listeners, setNodeRef, } = useDraggable({ id: block.id,});
    const {setNodeRef:setDropRef } = useDroppable({ id: block.id,});
    
    return(
        <button key={block.id} ref={(node)=>{setNodeRef(node); setDropRef(node);}}
        onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(parentContainerId);}} 
        style={{ 
            width: block.props.style.width,
            height: block.props.style.height,
            padding: block.props.style.padding,
            marginBottom:block.props.style.marginBottom,
            marginTop:block.props.style.marginTop,            
            backgroundColor: block.props.style.backgroundColor,
            color: block.props.style.color,
            fontSize: block.props.style.fontSize,
            fontWeight: block.props.style.fontWeight,
            fontStyle: block.props.style.fontStyle,}}>{block.props.text}
            <span {...listeners} {...attributes} style={{cursor: "grab", marginLeft: "8px"}}>⋮⋮</span>
        </button>
    );
}

export default ButtonBlock;