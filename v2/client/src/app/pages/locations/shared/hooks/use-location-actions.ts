import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { useSearchParams } from 'react-router-dom';

export type LocationActionType = 'create' | 'rename' | 'delete';

const ACTION_PERMISSION = { create: 'create', rename: 'update', delete: 'delete' } as const;

export function useLocationActions() {
  const [searchParams, setSearchParams] = useSearchParams();

  const action = searchParams.get('action') as LocationActionType | null;
  const targetId = searchParams.get('id');
  const parentId = searchParams.get('parentId');
  const { can: hasPermission } = usePermissions();
  const can = {
    create: hasPermission({ location: ['create'] }),
    update: hasPermission({ location: ['update'] }),
    delete: hasPermission({ location: ['delete'] }),
  };
  // A dialog opened from a shared URL must not appear for members who can't act on it.
  const allowedAction = action && can[ACTION_PERMISSION[action]] ? action : null;

  const openCreate = (parentLocationId?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', 'create');
      if (parentLocationId) {
        next.set('parentId', parentLocationId);
      } else {
        next.delete('parentId');
      }
      next.delete('id');
      return next;
    });
  };

  const openRename = (locationId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', 'rename');
      next.set('id', locationId);
      next.delete('parentId');
      return next;
    });
  };

  const openDelete = (locationId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', 'delete');
      next.set('id', locationId);
      next.delete('parentId');
      return next;
    });
  };

  const closeDialog = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('action');
      next.delete('id');
      next.delete('parentId');
      return next;
    });
  };

  return {
    action: allowedAction,
    can,
    targetId,
    parentId,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
  };
}
