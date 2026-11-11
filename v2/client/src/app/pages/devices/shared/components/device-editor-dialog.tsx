import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DeviceKeyPanel } from '@/app/pages/devices/shared/components/device-key-panel';
import { useDeviceActions } from '@/app/pages/devices/shared/hooks/use-device-actions';
import { useCreateDevice, useFetchDevices, useUpdateDevice } from '@/app/pages/devices/shared/hooks/use-devices-api';
import type { UpdateDeviceInput } from '@/app/pages/devices/shared/types';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';
import { getLocationPath } from '@/app/pages/locations/shared/lib/get-location-path';
import { useFetchTemplates } from '@/app/pages/templates/shared/hooks/use-templates-api';
import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/ui/select';
import { toast } from '@/app/shared/hooks/use-toast';

const deviceSchema = z.object({
  template_id: z.string().min(1, 'Please choose a template.'),
  name: z.string().min(1, 'Device name is required.').max(160),
  location_id: z.string().min(1, 'Please choose a location.'),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

/**
 * Register (?action=create) or edit (?action=edit&id=…) a device.
 * A device is an instance of a template, placed in a leaf location (one that can't hold other locations).
 */
export function DeviceEditorDialog() {
  const navigate = useNavigate();
  const { organisation } = useOrganisationContext();
  const { action, targetId, closeDialog } = useDeviceActions();
  const { devices } = useFetchDevices(organisation.id);
  const { locations } = useFetchLocations(organisation.id);
  const { templates } = useFetchTemplates(organisation.id);
  const { mutateAsync: create, isCreating } = useCreateDevice(organisation.id);
  const { mutateAsync: update, isUpdating } = useUpdateDevice(organisation.id);

  const device = action === 'edit' && targetId ? devices.find((item) => item.id === targetId) : undefined;
  const isOpen = action === 'create' || Boolean(device);
  const isSaving = isCreating || isUpdating;

  // Leaf locations, labelled with their full path so similarly named rooms are distinguishable.
  const leafLocations = useMemo(() => {
    const byId = new Map(locations.map((location) => [location.id, location]));
    return locations
      .filter((location) => !location.can_have_children)
      .map((location) => ({
        id: location.id,
        label: getLocationPath(location, byId)
          .map((item) => item.name)
          .join(' / '),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations]);

  // Post-creation state: show the device key after a successful create.
  const [created, setCreated] = useState<{ deviceId: string; key: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: { template_id: '', name: '', location_id: '' },
  });

  // Reset the form each time the dialog opens or switches device.
  useEffect(() => {
    if (isOpen) {
      reset({
        template_id: device?.template_id ?? '',
        name: device?.name ?? '',
        location_id: device?.location_id ?? '',
      });
      setCreated(null);
    }
  }, [isOpen, device?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchTemplateId = useWatch({ control, name: 'template_id' });
  const selectedTemplate = templates.find((template) => template.id === watchTemplateId);

  const finish = () => {
    if (created) void navigate(`/devices/${created.deviceId}`);
    else closeDialog();
  };

  const onSubmit = async (values: DeviceFormValues) => {
    try {
      if (device) {
        // Send only what changed.
        const changes: UpdateDeviceInput = {
          ...(values.name.trim() === device.name ? {} : { name: values.name.trim() }),
          ...(values.template_id === device.template_id ? {} : { template_id: values.template_id }),
          ...(values.location_id === device.location_id ? {} : { location_id: values.location_id }),
        };
        if (Object.keys(changes).length > 0) await update({ deviceId: device.id, values: changes });
        closeDialog();
        toast({ variant: 'success', title: 'Device updated' });
      } else {
        const result = await create({
          name: values.name.trim(),
          template_id: values.template_id,
          location_id: values.location_id,
        });
        setCreated({ deviceId: result.id, key: result.device_key });
        toast({ variant: 'success', title: 'Device registered successfully' });
      }
    } catch (cause: unknown) {
      setError('root', { message: cause instanceof Error ? cause.message : 'Unable to save device.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && finish()}>
      <DialogContent>
        {created ? (
          <DeviceKeyPanel deviceKey={created.key} onDone={finish} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{device ? 'Edit device' : 'Add device'}</DialogTitle>
              <DialogDescription>
                Choose what kind of device it is, give it a name, and place it where it&apos;s installed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4" noValidate>
              <Field>
                <FieldLabel htmlFor="device-template" required>
                  Template
                </FieldLabel>
                <Controller
                  name="template_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <SelectTrigger
                        id="device-template"
                        className="w-full"
                        aria-invalid={Boolean(errors.template_id)}
                        ref={field.ref}
                      >
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.template_id ? (
                  <FieldError>{errors.template_id.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {templates.length === 0
                      ? 'Create a template first — it defines what the device sends.'
                      : selectedTemplate
                        ? `Sends ${selectedTemplate.parameter_count} parameter${selectedTemplate.parameter_count === 1 ? '' : 's'}.`
                        : 'The template defines what the device sends.'}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="device-name" required>
                  Device name
                </FieldLabel>
                <Input
                  id="device-name"
                  placeholder="e.g. Knitting machine 07"
                  maxLength={160}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="device-location" required>
                  Location
                </FieldLabel>
                <Controller
                  name="location_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <SelectTrigger
                        id="device-location"
                        className="w-full"
                        aria-invalid={Boolean(errors.location_id)}
                        ref={field.ref}
                      >
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {leafLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.location_id ? (
                  <FieldError>{errors.location_id.message}</FieldError>
                ) : leafLocations.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Devices are placed in locations that don&apos;t contain other locations. Add one in Locations.
                  </p>
                ) : null}
              </Field>
              {device && watchTemplateId !== device.template_id && (
                <p className="text-muted-foreground rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                  The device will start reporting the new template&apos;s parameters. Readings already recorded are
                  kept.
                </p>
              )}
              <FieldError>{errors.root?.message}</FieldError>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSaving} onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving} loadingText={device ? 'Saving…' : 'Adding…'}>
                  {device ? 'Save changes' : 'Add device'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
