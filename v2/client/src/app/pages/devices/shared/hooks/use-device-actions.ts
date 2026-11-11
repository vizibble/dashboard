import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { useUrlDialog } from '@/app/shared/hooks/use-url-dialog';

export type DeviceActionType = 'create' | 'edit' | 'delete' | 'rotate-key';

const ACTION_PERMISSION = { create: 'create', edit: 'update', delete: 'delete', 'rotate-key': 'update' } as const;

export function useDeviceActions() {
  const { action, targetId, open, close } = useUrlDialog<DeviceActionType>();
  const { can: hasPermission } = usePermissions();
  const can = {
    create: hasPermission({ device: ['create'] }),
    update: hasPermission({ device: ['update'] }),
    delete: hasPermission({ device: ['delete'] }),
  };
  // A dialog opened from a shared URL must not appear for members who can't act on it.
  const allowedAction = action && can[ACTION_PERMISSION[action]] ? action : null;

  return {
    action: allowedAction,
    can,
    targetId,
    openCreate: () => open('create'),
    openEdit: (deviceId: string) => open('edit', deviceId),
    openDelete: (deviceId: string) => open('delete', deviceId),
    openRotateKey: (deviceId: string) => open('rotate-key', deviceId),
    closeDialog: close,
  };
}
