import AppearanceSection from "./AppearenceSection";
import BlockActions from "./BlockActions";

interface ButtonPropertiesProps{
    selectedBlock: any;

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;

    updateNodeStyle:(
    id: number,
    text: string,
    value: string|number
    ) => void;  

    deleteNode: (nodeId:number) => void;

    moveNode: (parentContainerId:number, fromIndex:number, toIndex:number) => void;

    parentId: number;

    index: number;

    isFirst: boolean;

    isLast: boolean;
}

function ButtonProperties({selectedBlock, updateNodeProp, updateNodeStyle, moveNode, deleteNode, parentId, index, isFirst, isLast}:ButtonPropertiesProps){
return(

          <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col">
            <h3>Selected Block</h3>

            <p>
              Type: {selectedBlock.type}
            </p>

            <p>
              Text:
            </p>

            <input
                value={selectedBlock.props.text}
                onChange={(e) =>
                updateNodeProp(
                    selectedBlock.id,
                    "text",
                    e.target.value
                )
                }
            />
            <AppearanceSection selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} marginAvailable={true}/>
            <BlockActions selectedBlock={selectedBlock} moveNode={moveNode} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} />
          </aside>        

)
}

export default ButtonProperties;