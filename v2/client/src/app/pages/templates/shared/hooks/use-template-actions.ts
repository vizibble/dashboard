import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { useUrlDialog } from '@/app/shared/hooks/use-url-dialog';

export type TemplateActionType = 'create' | 'edit' | 'parameters' | 'delete';

const ACTION_PERMISSION = { create: 'create', edit: 'update', parameters: 'update', delete: 'delete' } as const;

export function useTemplateActions() {
  const { action, targetId, open, close } = useUrlDialog<TemplateActionType>();
  const { can: hasPermission } = usePermissions();
  const can = {
    create: hasPermission({ template: ['create'] }),
    update: hasPermission({ template: ['update'] }),
    delete: hasPermission({ template: ['delete'] }),
  };
  // A dialog opened from a shared URL must not appear for members who can't act on it.
  const allowedAction = action && can[ACTION_PERMISSION[action]] ? action : null;

  return {
    action: allowedAction,
    can,
    targetId,
    openCreate: () => open('create'),
    openEdit: (templateId: string) => open('edit', templateId),
    openParameters: (templateId: string) => open('parameters', templateId),
    openDelete: (templateId: string) => open('delete', templateId),
    closeDialog: close,
  };
}
