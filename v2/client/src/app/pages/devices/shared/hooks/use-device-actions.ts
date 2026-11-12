import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { useUrlDialog } from '@/app/shared/hooks/use-url-dialog';

const ACTIONS = ['create', 'edit', 'delete', 'rotate-key'] as const;

export type DeviceActionType = (typeof ACTIONS)[number];

const ACTION_PERMISSION = {
  create: 'create',
  edit: 'update',
  delete: 'delete',
  'rotate-key': 'update',
} as const;

export function useDeviceActions() {
  const { can: hasPermission } = usePermissions();

  const can = {
    create: hasPermission({ device: ['create'] }),
    update: hasPermission({ device: ['update'] }),
    delete: hasPermission({ device: ['delete'] }),
  };

  // A dialog opened from a shared URL must not appear for members who can't act on it.
  const { action, targetId, open, close } = useUrlDialog(
    ACTIONS.filter((candidate) => can[ACTION_PERMISSION[candidate]]),
  );

  return {
    action,
    can,
    targetId,
    openCreate: () => open('create'),
    openEdit: (deviceId: string) => open('edit', deviceId),
    openDelete: (deviceId: string) => open('delete', deviceId),
    openRotateKey: (deviceId: string) => open('rotate-key', deviceId),
    closeDialog: close,
  };
}
