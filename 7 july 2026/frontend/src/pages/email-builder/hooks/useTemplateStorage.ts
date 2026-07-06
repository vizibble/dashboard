import { getTemplate, saveTemplate } from "../services/templateApi";
import type { Block } from "../types/blocks";

export function useTemplateStorage(
  blocks: Block[],
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
) {

  const handleTempSave = async () => {
    const now = new Date().toISOString();

    await saveTemplate({
      id: crypto.randomUUID(),
      name: "Test Template",
      description: "Testing",
      type: "email",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      blocks,
    });
  };

  const handleTempLoad = async () => {
    const template = await getTemplate();

    if (!template) return;

    //console.log("useTemplateStorage", template.blocks, typeof(template.blocks));
    setBlocks(
      template.blocks
    );
  };

  return {
    handleTempSave,
    handleTempLoad,
  };
}