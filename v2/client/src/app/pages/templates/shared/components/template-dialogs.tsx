import { TemplateDeleteDialog } from '@/app/pages/templates/shared/components/template-delete-dialog';
import { TemplateEditorDialog } from '@/app/pages/templates/shared/components/template-editor-dialog';
import { TemplateParametersDialog } from '@/app/pages/templates/shared/components/template-parameters-dialog';

export function TemplateDialogs() {
  return (
    <>
      <TemplateEditorDialog />
      <TemplateParametersDialog />
      <TemplateDeleteDialog />
    </>
  );
}
