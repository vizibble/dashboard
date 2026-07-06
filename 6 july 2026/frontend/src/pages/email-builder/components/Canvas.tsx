import BlockRenderer from "./blocks/BlockRenderer";
import {Save, Loader} from "lucide-react";
import ToolButton from "./properties/ToolButtons";


interface CanvasProps {
  blocks: any[];

  selectedContainerId: null|number;

  setSelectedContainerId: (
    id: number | null
  ) => void;

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;  

  selectedBlockId: null|number;

  setSelectedBlockId: (
    id: number | null
  ) => void;

    updateNodeStyles:(
    id: number,
    width:string|number,
    height:string|number
    ) => void; 

  handleTempSave:()=>void;

  handleTempLoad: ()=>void;

  deleteNode: (nodeId:number) => void;  

}

function Canvas({blocks, selectedContainerId, updateNodeProp,setSelectedContainerId, selectedBlockId, setSelectedBlockId, updateNodeStyles, handleTempLoad, handleTempSave, deleteNode}:CanvasProps) {
  return (
    <main className="canvas flex-1 flex flex-col overflow-auto bg-slate-100 p-8 pb-20 gap-[10px]" key={"canvas"} >
      <div className="ToolBar flex justify-between gap-[5px] w-[40%] max-w-[600px] min-w-[300px] mx-auto bg-transparent rounded-lg">
        
          <ToolButton onClick={handleTempSave} icon={Save}>
            Save
          </ToolButton>
        
          <ToolButton onClick={handleTempLoad} icon={Loader}>
            Load
          </ToolButton>
                  
      </div>
<div className="email-preview w-[90%] max-w-[1200px] min-w-[600px] mx-auto bg-white self-center rounded-lg shadow-lg" key={"email-preview"} onClick={()=>{setSelectedBlockId(null); setSelectedContainerId(null)}}>
        {blocks.map((block, index) => {
            return(
            <BlockRenderer updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} index = {index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={block.id} updateNodeStyles={updateNodeStyles} />
            )
        })}
      </div>
    </main>
  );
}

export default Canvas;

    