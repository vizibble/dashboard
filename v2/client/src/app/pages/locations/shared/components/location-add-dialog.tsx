import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import { useCreateLocation, useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';
import type { LocationFormInput, LocationFormValues } from '@/app/pages/locations/shared/types';
import { createLocationSchema } from '@vizibble/shared/locations';

import { Button } from '@/app/shared/components/ui/button';
import { Checkbox } from '@/app/shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/shared/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { toast } from '@/app/shared/hooks/use-toast';

export function LocationAddDialog() {
  const navigate = useNavigate();
  const { organisation } = useOrganisationContext();
  const { action, parentId, closeDialog } = useLocationActions();
  const { locations } = useFetchLocations(organisation.id);
  const { isCreating, mutateAsync } = useCreateLocation(organisation.id);

  const isOpen = action === 'create';
  const parentLocation = parentId ? locations.find((l) => l.id === parentId) : null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormInput, unknown, LocationFormValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: '',
      parent_id: null,
      can_have_children: false,
    },
  });

  // Reset form with context whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        parent_id: parentId ?? null,
        can_have_children: false,
      });
    }
  }, [isOpen, parentId, reset]);

  const onSubmit = async (values: LocationFormValues) => {
    try {
      const created = await mutateAsync({
        ...values,
        parent_id: parentId ?? null,
      });
      closeDialog();
      toast({
        variant: 'success',
        title: 'Location created',
        description: `"${created.name}" has been added successfully.`,
      });
      void navigate(`/locations/${created.id}`);
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to create location',
        description: cause instanceof Error ? cause.message : 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-border/60 border-b px-6 py-5">
          <DialogTitle>{parentLocation ? `Add sub-location in ${parentLocation.name}` : 'Add location'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-5 px-6 py-5" noValidate>
          <Field>
            <FieldLabel htmlFor="location-name" required>
              Location name
            </FieldLabel>
            <Input
              id="location-name"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              maxLength={160}
              placeholder="e.g. Main Plant, Building A, Floor 2"
              aria-invalid={Boolean(errors.name)}
              disabled={isCreating}
              {...register('name')}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <div>
            <Field orientation="horizontal" className="items-center gap-3">
              <Controller
                name="can_have_children"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="location-can-have-children"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={isCreating}
                  />
                )}
              />
              <div className="min-w-0 space-y-1">
                <FieldLabel htmlFor="location-can-have-children" className="cursor-pointer font-medium">
                  Allow sub-locations
                </FieldLabel>
                <FieldDescription>Enable this if the location should contain other locations.</FieldDescription>
              </div>
            </Field>
          </div>
          <DialogFooter className="border-border/60 -mx-6 -mb-5 border-t px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" disabled={isCreating} onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Spinner className="size-4" />}
              {isCreating ? 'Creating...' : 'Create location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
