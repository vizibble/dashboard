import HeadingBlock from "./HeadingBlock";
import TextBlock from "./TextBlock";
import SectionBlock from "./SectionBlock";
import ImageBlock from "./ImageBlock";
import SpacerBlock from "./SpacerBlock";
import DividerBlock from "./DividerBlock";
import RowBlock from "./RowBlock";
import ColumnBlock from "./ColumnBlock";
import ChartBlock from "./ChartBlock";
import MetricBlock from "./MetricBlock";
import ResizableBlock from "./ResizableBlock";
import DateTimeBlock from "./DateTimeBlock";
import type { Block } from "../../types/blocks";


interface BlockRendererProps{
  block: Block;

  index:number;

  selectedContainerId: null|number;

  setSelectedContainerId: (
    id: number | null
  ) => void;

  selectedBlockId: null|number;

  setSelectedBlockId: (
    id: number | null
  ) => void;

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

function BlockRenderer({block, index, selectedContainerId, updateNodeProp,setSelectedContainerId, selectedBlockId, setSelectedBlockId, parentContainerId, updateNodeStyles, deleteNode}:BlockRendererProps){

            if (block.type == "heading"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                        <HeadingBlock updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     
                );
            }
            if (block.type == "text"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                        <TextBlock updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     
                );
            }
            if (block.type == "date"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                        <DateTimeBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     
                );
            }            
            if (block.type == "section"){
                return (                    
                    <SectionBlock updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} updateNodeStyles={updateNodeStyles}/>
                );
            }

            if (block.type == "image"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {{
                            updateNodeStyles(
                                block.id,
                                size.width,
                                block.props.style.height
                            );
                        }
                    }}
                    >
                        <ImageBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId} updateNodeProp={updateNodeProp}/>
                    </ResizableBlock>                     
                );
            }

            if (block.type == "spacer"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                        <SpacerBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     
                );
            }

            if (block.type == "divider"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                        <DividerBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     
                );
            }

            if (block.type == "row"){
                return (                    
                    <RowBlock updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId} updateNodeStyles={updateNodeStyles}/>
                );
            }

            if (block.type == "column"){
                return (                    
                    <ColumnBlock updateNodeProp={updateNodeProp} deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId} updateNodeStyles={updateNodeStyles}/>
                );
            }

            if (block.type == "chart"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                    <ChartBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                     

                );
            }           

            if (block.type == "metric"){
                return (
                    <ResizableBlock
                    selected={selectedBlockId === block.id}
                    width={block.props.style.width}
                    height={block.props.style.height}
                    onResize={(size) => {updateNodeStyles(block.id, size.width, size.height);}}
                    >
                    <MetricBlock deleteNode={deleteNode} block={block} index={index} selectedContainerId={selectedContainerId} setSelectedContainerId={setSelectedContainerId} selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId} parentContainerId={parentContainerId}/>
                    </ResizableBlock>                    
                );
            }


            return null;
}

export default BlockRenderer;