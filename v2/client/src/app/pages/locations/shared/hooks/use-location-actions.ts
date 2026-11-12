import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { useSearchParams } from 'react-router-dom';

export type LocationActionType = 'create' | 'rename' | 'delete';

const ACTION_PERMISSION = {
  create: 'create',
  rename: 'update',
  delete: 'delete',
} as const;

function parseAction(value: string | null): LocationActionType | null {
  if (value === 'create' || value === 'rename' || value === 'delete') {
    return value;
  }

  return null;
}

type DialogParams = {
  action: LocationActionType;
  id?: string;
  parentId?: string;
};

export function useLocationActions() {
  const [searchParams, setSearchParams] = useSearchParams();

  const action = parseAction(searchParams.get('action'));

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

  // Replaces the dialog params (action, id, parentId) in the URL; omitted params are removed.
  const setDialogParams = (params: DialogParams | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      next.delete('action');
      next.delete('id');
      next.delete('parentId');
      if (!params) {
        return next;
      }
      next.set('action', params.action);
      if (params.id) {
        next.set('id', params.id);
      }
      if (params.parentId) {
        next.set('parentId', params.parentId);
      }

      return next;
    });
  };

  return {
    action: allowedAction,
    can,
    targetId,
    parentId,
    openCreate: (parentLocationId?: string) =>
      setDialogParams({ action: 'create', parentId: parentLocationId }),
    openRename: (locationId: string) => setDialogParams({ action: 'rename', id: locationId }),
    openDelete: (locationId: string) => setDialogParams({ action: 'delete', id: locationId }),
    closeDialog: () => setDialogParams(null),
  };
}
