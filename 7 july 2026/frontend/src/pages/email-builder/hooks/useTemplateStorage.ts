import { getTemplate, saveTemplate } from "../services/templateApi";

export function useTemplateStorage(
  blocks: any[],
  setBlocks: (blocks: any[]) => void,
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