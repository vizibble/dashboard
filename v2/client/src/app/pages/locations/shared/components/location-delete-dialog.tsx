import { WarningCircleIcon } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import { useDeleteLocation } from '@/app/pages/locations/shared/hooks/use-location-mutations';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';

import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { Input } from '@/app/shared/components/ui/input';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';
import { useMemo, useState } from 'react';

export function LocationDeleteDialog() {
  const navigate = useNavigate();

  const { locationId: activeLocationId } = useParams();

  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useLocationActions();

  const { data: locations = [] } = useFetchLocations(organisation.id);

  const { mutateAsync, isPending: isDeleting } = useDeleteLocation(organisation.id);

  const [confirmName, setConfirmName] = useState('');

  const location = targetId ? locations.find((item) => item.id === targetId) : null;

  const isOpen = action === 'delete' && Boolean(location);

  const directChildCount = useMemo(() => {
    if (!location) {
      return 0;
    }

    return locations.filter((item) => item.parent_id === location.id).length;
  }, [locations, location]);

  const hasChildren = directChildCount > 0;

  const isNameConfirmed = Boolean(location && confirmName.trim() === location.name);

  const canConfirm = !hasChildren && isNameConfirmed;

  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) {
      setConfirmName('');
      closeDialog();
    }
  };

  const handleDelete = async () => {
    if (!location || !canConfirm) {
      return;
    }
    const { id, name } = location;

    try {
      await mutateAsync(id);
      setConfirmName('');
      closeDialog();
      toast({
        variant: 'success',
        title: 'Location deleted',
        description: `"${name}" has been permanently deleted.`,
      });
      if (activeLocationId === id) {
        void navigate('/locations', { replace: true });
      }
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to delete location',
        description: getErrorMessage(cause),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="pt-2">Delete location?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. It will permanently remove this location from your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-4">
          {hasChildren ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-xs leading-relaxed"
            >
              <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-destructive font-semibold">Cannot delete location with children</p>
                <p className="text-muted-foreground mt-1">
                  This location currently contains{' '}
                  <span className="text-foreground font-semibold">
                    {directChildCount} {directChildCount === 1 ? 'sub-location' : 'sub-locations'}
                  </span>
                  . You must remove or reassign all sub-locations before this location can be deleted.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                To confirm deletion, please enter the name of the location{' '}
                <strong className="text-foreground select-all">&quot;{location?.name}&quot;</strong> below:
              </p>
              <Input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={location?.name}
                aria-label={`Enter "${location?.name}" to confirm deletion`}
                disabled={isDeleting}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-border mt-6 gap-2 border-t px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => {
              setConfirmName('');
              closeDialog();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || !canConfirm}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? (
              <>
                <Spinner className="size-4" />
                Deleting...
              </>
            ) : (
              'Delete location'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
