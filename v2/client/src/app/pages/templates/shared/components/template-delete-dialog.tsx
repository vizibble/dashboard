import { useNavigate, useParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { useDeleteTemplate } from '@/app/pages/templates/shared/hooks/use-template-mutations';
import { useFetchTemplates } from '@/app/pages/templates/shared/hooks/use-template-queries';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

export function TemplateDeleteDialog() {
  const navigate = useNavigate();

  const { templateId: activeTemplateId } = useParams();

  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useTemplateActions();

  const { data: templates = [] } = useFetchTemplates(organisation.id);

  const { mutateAsync, isPending: isDeleting } = useDeleteTemplate(organisation.id);

  const template =
    action === 'delete' && targetId ? templates.find((item) => item.id === targetId) : undefined;

  const handleDelete = async () => {
    if (!template) {
      return;
    }
    try {
      await mutateAsync(template.id);
      closeDialog();
      toast({
        variant: 'success',
        title: 'Template deleted',
        description: `"${template.name}" has been deleted.`,
      });
      if (activeTemplateId === template.id) {
        void navigate('/templates', { replace: true });
      }
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to delete template',
        description: getErrorMessage(cause),
      });
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(template)}
      onClose={closeDialog}
      onConfirm={() => void handleDelete()}
      title="Delete template?"
      description={`"${template?.name}" will be deleted. Templates that devices still use can't be deleted.`}
      confirmLabel="Delete template"
      destructive
      isPending={isDeleting}
    />
  );
}
