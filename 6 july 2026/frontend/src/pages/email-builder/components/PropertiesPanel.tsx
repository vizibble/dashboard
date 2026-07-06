import ChartProperties from "./properties/ChartProperties"
import MetricProperties from "./properties/MetricProperties";
import ColumnProperties from "./properties/ColumnProperties";
import RowProperties from "./properties/RowProperties";
import DividerProperties from "./properties/DividerProperties";
import SpacerProperties from "./properties/SpacerProperties";
import ImageProperties from "./properties/ImageProperties";
import ButtonProperties from "./properties/ButtonProperties";
import TextHeadingProperties from "./properties/TextHeadingProperties";
import SectionProperties from "./properties/SectionProperties";
import DateTimeProperties from "./properties/DateTimeProperties";
interface PropertiesPanelProps{
    selectedBlock:any;

    selectedNodeWithMeta: any;

    findParent: (parentId:number) => any;

    updateNodeProp:(
        id: number,
        text: string,
        value: string|number
        ) => void;

    updateConfig:(
        id: number,
        text: string,
        value: string|boolean|number|null
        ) => void;

    updateNodeStyle:(
        id: number,
        text: string,
        value: string|number
        ) => void;
    
    updateDevice:(
        id: number,
        text: string,
        value: string
    ) => void;

    deleteNode: (nodeId:number) => void;

    moveNode: (parentContainerId:number, fromIndex:number, toIndex:number) => void;

    moveSection: (fromIndex:number, toIndex: number) => void;
}

function PropertiesPanel({selectedBlock, selectedNodeWithMeta, findParent, updateNodeProp, updateConfig, updateNodeStyle, deleteNode, moveNode, moveSection, updateDevice}:PropertiesPanelProps){
    
  if (!selectedBlock) {
      return (
        <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          No Element Selected
            </h3>          
        </aside>
      );
    }

    const parentId = selectedNodeWithMeta.parentContainerId;
    const index = selectedNodeWithMeta.index;
    const parent = parentId !== null?findParent(parentId):null;
    const totalSiblings = parent?parent.children.length:0
    const isFirst = index === 0
    const isLast = totalSiblings - 1 === index

    if(selectedBlock.type === "section"){
        return (
          <SectionProperties selectedBlock={selectedBlock} moveSection = {moveSection} deleteNode={deleteNode} index={index} isFirst={isFirst} isLast={isLast} updateNodeStyle={updateNodeStyle}/>
        );
    }    

    if(selectedBlock.type === "text" || selectedBlock.type == "heading"){
        return (
          <TextHeadingProperties selectedBlock={selectedBlock} updateNodeProp={updateNodeProp} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "date"){
      return (
        <DateTimeProperties selectedBlock={selectedBlock} updateNodeProp={updateNodeProp} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>        
      );
    }

    if(selectedBlock.type === "button"){
        return (
          <ButtonProperties selectedBlock={selectedBlock} updateNodeProp={updateNodeProp} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "image"){
      return(
          <ImageProperties selectedBlock={selectedBlock} updateNodeProp={updateNodeProp} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
      )
    }

    if(selectedBlock.type === "spacer"){
        return (
          <SpacerProperties selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "divider"){
        return (
          <DividerProperties selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "row"){
        return (
          <RowProperties selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "column"){
        return (
          <ColumnProperties selectedBlock={selectedBlock} updateNodeStyle={updateNodeStyle} deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>
        );
    }

    if(selectedBlock.type === "chart"){
      return(<ChartProperties selectedBlock={selectedBlock} updateConfig={updateConfig} updateNodeStyle={updateNodeStyle} updateDevice={updateDevice}deleteNode={deleteNode} moveNode={moveNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast}/>)
    }

    if(selectedBlock.type === "metric"){
      return(<MetricProperties selectedBlock={selectedBlock} updateConfig={updateConfig} updateNodeStyle={updateNodeStyle} updateDevice={updateDevice} deleteNode={deleteNode} parentId={parentId} index={index} isFirst={isFirst} isLast={isLast} moveNode={moveNode}/>)
    }

    return (
      <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col">
        No editor available
      </aside>
    );

}

export default PropertiesPanel;

