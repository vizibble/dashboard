import BlockRenderer from "./BlockRenderer";

interface SectionBlockProps{
    block: any;

    selectedContainerId: null|number;

    setSelectedContainerId: (
        id: number | null
    ) => void;

    selectedBlockId: number | null;

    setSelectedBlockId:(id:number|null) => void;

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

function SectionBlock({block, updateNodeProp,selectedContainerId, setSelectedContainerId, selectedBlockId, setSelectedBlockId, updateNodeStyles, deleteNode}:SectionBlockProps) {  

  return (
    <div key={block.id} className="transition-shadow duration-150"
      onClick={(e) => {e.stopPropagation(); setSelectedBlockId(block.id); setSelectedContainerId(block.id); 
      }}
      style={{
        minHeight: "120px",
        display: "flex",
        flexDirection:"column",
        alignItems:"center",
        gap:"2px",
        width:block.props.style.width,
        height:block.props.style.height,
        padding: block.props.style.padding,
        marginBottom:block.props.style.marginBottom,
        marginTop:block.props.style.marginTop,        
        backgroundColor: block.props.style.backgroundColor,
        color: block.props.style.color,
        boxShadow:selectedBlockId === block.id
        ? "0 0 0 2px #2563eb"
        : undefined,
        border:"1px solid lightgray"        
      }}
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

    </div>
  );
}

export default SectionBlock;