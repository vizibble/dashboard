import { useState, useEffect} from "react";

import Canvas from "./components/Canvas";
import PropertiesPanel from "./components/PropertiesPanel";
import Sidebar from "./components/Sidebar";
import { useTemplateStorage } from "./hooks/useTemplateStorage";
import { findNodeById, findNodeMetaById, moveNodeWithinContainer, moveNodeAcrossContainers } from "./utils/tree";

import { DndContext } from "@dnd-kit/core";
import { createButton, createDate, createDivider, createHeading, createImage, createSection, createSpacer, createText } from "./factories/blockFactory";
import { createChart } from "./factories/chartFactory";
import type { ChartType } from "./types/chart";
import { useTree } from "./hooks/useTree";
import { useEditor } from "./hooks/useEditor";
import { createColumn, createRowWithColumns } from "./factories/layoutFactory";
import { getDevices } from "./services/api";
import { createMetric } from "./factories/metricfactory";



function App(){

  const [blocks, setBlocks] = useState<any[]>(() => {
  const savedBlocks =
      localStorage.getItem("blocks");

    if (savedBlocks) {
      return JSON.parse(savedBlocks);
    }

    return [];
  });
  useEffect(()=>{
    localStorage.setItem("blocks", JSON.stringify(blocks));
  }, [blocks]);  
  
  const [selectedContainerId, setSelectedContainerId] =
  useState<number | null>(null);

  const selectedContainer = findNodeById(blocks, selectedContainerId);

  const [selectedBlockId, setSelectedBlockId] =
  useState<number | null>(null);

  const selectedBlock =findNodeById(blocks, selectedBlockId);
  const selectedNodeWithMeta = findNodeMetaById(blocks, selectedBlockId);

  const [devices, setDevices] = useState<any[]>([]);
  useEffect(() => {getDevices().then(setDevices);}, []);

  const {handleTempSave,handleTempLoad,} = useTemplateStorage(blocks,setBlocks);  
  const {addNodeToContainer, deleteNode, moveNode, moveSection, findParent} = useTree(blocks, setBlocks, selectedContainerId,setSelectedContainerId, selectedBlockId, setSelectedBlockId, selectedContainer);
  const {updateNodeProp, updateConfig, updateDevice, updateNodeStyle, updateNodeStyles} = useEditor(blocks, setBlocks);

  const addColumn = (count: number) => {
    if(selectedContainer === null || selectedContainer.type === "section"){
      const row = createRowWithColumns(count);
      addNodeToContainer(row);
      return;
    }

    if(selectedContainer.type === "column"){
      return;
    }

    if(selectedContainer.type === "row"){
      if(selectedContainer.children.length > 3) return;
      const column = createColumn();
      addNodeToContainer(column);
      return;
    }
  }

  const addSection = () => {
    const newSection = createSection(undefined);
    setBlocks([...blocks,newSection]);
    setSelectedContainerId(
      newSection.id
    );
    setSelectedBlockId(
      newSection.id
    );
  };

  const addBlock = (block: any) => {
    addNodeToContainer(block);
    
  };

  const addHeading = () => {
    addBlock(createHeading());
  };
  
  const addText = () => {
    addBlock(createText());
  };

  const addButton = () => {
    addBlock(createButton())
  }

  const addImage = () => {
    addBlock(createImage())
  }

  const addSpacer = () => {
    addBlock(createSpacer())
  }

  const addDivider = () => {
    addBlock(createDivider())
  }

  const addChart = (type: ChartType) => {
    if(devices.length == 0){
      return;
    }
    addBlock(createChart(type, devices[0].device_id, devices[0].name))
  }

  const addMetric = () =>{
    addBlock(createMetric(devices[0].device_id, devices[0].name))
  }

  const addDate = () => {
    addBlock(createDate());
    
  } 

  const handleDragEnd = (event: any) => {//handles dragging
    const activeMeta =
      findNodeMetaById(
        blocks,
        Number(event.active.id)
      );

    const overMeta =
      findNodeMetaById(
        blocks,
        Number(event.over.id)
      );

    if (!activeMeta || !overMeta) {
      return;
    }

    if (activeMeta.id === overMeta.id){
      return;
    }

    if(activeMeta.parentContainerId === overMeta.parentContainerId){
      const updatedBlocks =moveNodeWithinContainer(blocks, activeMeta.parentContainerId, activeMeta.index, overMeta.index);
      setBlocks(updatedBlocks);
      return;
    }else{
      if(activeMeta.type === "column" && ["section", "column"].includes(overMeta.type)){
        return;
      }
      if(activeMeta.type === "row" && ["row", "column"].includes(overMeta.type)){
        return;
      }
      if(activeMeta.type === "section" && ["row", "column", "section"].includes(overMeta.type)){
        return;
      }      
      if(activeMeta.type !== "column" && overMeta.type === "row"){
        return;
      }   
      const destinationContainerId = ["section", "column", "row"].includes(overMeta.type)?overMeta.id:overMeta.parentContainerId;
      const updatedBlocks = moveNodeAcrossContainers(blocks, destinationContainerId, activeMeta.id);
      setBlocks(updatedBlocks);
      return;
    }
    
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="app h-screen flex bg-slate-100">
        <Sidebar addDate = {addDate} addHeading={addHeading} addText = {addText} addButton={addButton} addSection={addSection} addImage={addImage} addSpacer={addSpacer} addDivider={addDivider} addColumn={addColumn} addChart={addChart} addMetric={addMetric}/>
        <Canvas updateNodeProp={updateNodeProp} deleteNode={deleteNode} handleTempLoad={handleTempLoad} handleTempSave={handleTempSave} blocks={blocks} selectedContainerId = {selectedContainerId} setSelectedContainerId = {setSelectedContainerId} selectedBlockId = {selectedBlockId} setSelectedBlockId = {setSelectedBlockId} updateNodeStyles={updateNodeStyles}/>
        <PropertiesPanel selectedBlock = {selectedBlock} selectedNodeWithMeta = {selectedNodeWithMeta} findParent = {findParent} updateNodeProp={updateNodeProp} updateConfig={updateConfig} updateNodeStyle={updateNodeStyle} updateDevice={updateDevice} deleteNode = {deleteNode} moveNode={moveNode} moveSection={moveSection} />
      </div>
    </DndContext>
  );
}

export default App;