import { deleteNodeById, findNodeById, insertNodeIntoContainer, moveNodeWithinContainer, moveSectionInBlock, removeEmptyRows } from "../utils/tree";
import { createSection } from "../factories/blockFactory";
import type { Block } from "../types/blocks";

export function useTree(
  blocks: Block[],
  setBlocks: React.Dispatch<React.SetStateAction<any[]>>,
  selectedContainerId: number | null,
  setSelectedContainerId: (id: number | null) => void,
  selectedBlockId:number|null,
  setSelectedBlockId: (id: number | null) => void,
  selectedContainer: Block|null,
) {

    const allowedChildren = {
        section: ["heading", "text", "image", "spacer", "divider", "button", "row", "chart", "metric", "date"],
        column: ["heading", "text", "image", "spacer", "divider", "button", "chart", "metric", "date"],
        row:["column"],
    };

  const addNodeToContainer = (
    newBlock: any
  ) => {

    if (selectedContainerId === null) {
      if(!allowedChildren["section"].includes(newBlock.type)){
        return;
      }
      const newSection = createSection(newBlock)
      setBlocks([...blocks, newSection])
      setSelectedContainerId(
        newSection.id
      );
      setSelectedBlockId(
        newBlock.id
      );
      return;
    }

    if(!allowedChildren[selectedContainer.type as keyof typeof allowedChildren].includes(newBlock.type)){
      return;
    }

    const updatedBlocks  =
      insertNodeIntoContainer(
        blocks,
        selectedContainerId,
        newBlock
      );

    setBlocks(updatedBlocks);
    setSelectedBlockId(
      newBlock.id
    );
  };

  const deleteNode = (nodeId:number) => {
    const updatedBlocks = deleteNodeById(blocks,nodeId);

    const cleanedBlocks = removeEmptyRows(updatedBlocks);

    setBlocks(cleanedBlocks);

    if(selectedBlockId == selectedContainerId){
      setSelectedBlockId(null);
      setSelectedContainerId(null);
    }else{
      setSelectedBlockId(selectedContainerId);
    }
  }

  const moveNode = (parentContainerId:number, fromIndex:number, toIndex:number) => {
    const updatedBlocks = moveNodeWithinContainer(blocks, parentContainerId, fromIndex, toIndex);
    setBlocks(updatedBlocks);
  } 
  
  const moveSection = (fromIndex:number, toIndex:number) => {
    const updatedBlocks = moveSectionInBlock(blocks, fromIndex, toIndex)
    setBlocks(updatedBlocks);
  }

  const findParent = (parentId:number) => {
    return findNodeById(blocks, parentId);
  }

  return {addNodeToContainer, deleteNode, moveNode, moveSection, findParent}

}