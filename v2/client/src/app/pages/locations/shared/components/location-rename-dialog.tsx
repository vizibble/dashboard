import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import { useRenameLocation } from '@/app/pages/locations/shared/hooks/use-location-mutations';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';
import type { LocationRenameValues } from '@/app/pages/locations/shared/types';
import { renameLocationSchema } from '@vizibble/shared/locations';

import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

export function LocationRenameDialog() {
  const { organisation } = useOrganisationContext();

  const { action, targetId, closeDialog } = useLocationActions();

  const { data: locations = [] } = useFetchLocations(organisation.id);

  const { isPending: isRenaming, mutateAsync } = useRenameLocation(organisation.id);

  const location = targetId ? locations.find((item) => item.id === targetId) : null;

  const isOpen = action === 'rename' && Boolean(location);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LocationRenameValues>({
    resolver: zodResolver(renameLocationSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (location) {
      reset({ name: location.name });
    }
  }, [location, reset]);

  const onSubmit = async (values: LocationRenameValues) => {
    if (!location) {
      return;
    }
    try {
      const updated = await mutateAsync({
        locationId: location.id,
        values,
      });

      closeDialog();
      toast({
        variant: 'success',
        title: 'Location renamed',
        description: `"${updated.name}" has been renamed successfully.`,
      });
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to rename location',
        description: getErrorMessage(cause),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRenaming && closeDialog()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Rename location</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
          <div className="px-6 py-5">
            <Field>
              <FieldLabel htmlFor="location-rename" required>
                Location name
              </FieldLabel>
              <Input
                id="location-rename"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                maxLength={160}
                placeholder="e.g. Main Plant, Building A, Server Room"
                aria-invalid={Boolean(errors.name)}
                disabled={isRenaming}
                {...register('name')}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" disabled={isRenaming} onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming || !isDirty}>
              {isRenaming ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
