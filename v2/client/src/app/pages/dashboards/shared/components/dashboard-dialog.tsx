import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { CheckboxField } from '@/app/pages/dashboards/shared/components/checkbox-field';
import {
  useCreateDashboard,
  useOrganisationSettings,
  useUpdateDashboard,
  useUpdateOrganisationSettings,
} from '@/app/pages/dashboards/shared/hooks/use-dashboards-api';
import { REFRESH_OPTIONS } from '@/app/pages/dashboards/shared/lib/labels';
import type { DashboardDetail, DashboardTarget } from '@/app/pages/dashboards/shared/types';
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
import { Textarea } from '@/app/shared/components/ui/textarea';
import { toast } from '@/app/shared/hooks/use-toast';

const dashboardSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(160),
  description: z.string().max(2000).optional(),
  refresh: z.number(),
  timezone: z.string(),
  shared: z.boolean(),
  isDefault: z.boolean(),
});

type DashboardFormValues = z.infer<typeof dashboardSchema>;

type DashboardDialogProps = {
  target: DashboardTarget;
  /** null = closed, 'new' = create, otherwise the dashboard to edit. */
  dashboard: DashboardDetail | 'new' | null;
  onClose: () => void;
  onCreated: (dashboardId: string) => void;
};

function timezoneOptions() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC'];
  }
}

export function DashboardDialog({ target, dashboard, onClose, onCreated }: DashboardDialogProps) {
  const existing = dashboard !== null && dashboard !== 'new' ? dashboard : null;
  return (
    <Dialog open={dashboard !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {dashboard !== null && (
          <DashboardForm
            key={existing?.id ?? 'new'}
            target={target}
            existing={existing}
            onClose={onClose}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DashboardForm({
  target,
  existing,
  onClose,
  onCreated,
}: Omit<DashboardDialogProps, 'dashboard'> & { existing: DashboardDetail | null }) {
  const { organisation } = useOrganisationContext();
  const { mutateAsync: create, isCreating } = useCreateDashboard(organisation.id);
  const { mutateAsync: update, isUpdating } = useUpdateDashboard(organisation.id);
  const { settings } = useOrganisationSettings(organisation.id);
  const { mutateAsync: updateSettings, isUpdating: isUpdatingSettings } = useUpdateOrganisationSettings(
    organisation.id,
  );
  const isSaving = isCreating || isUpdating || isUpdatingSettings;
  const zones = useMemo(() => timezoneOptions(), []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DashboardFormValues>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      refresh: existing?.refresh_seconds ?? 60,
      timezone: existing ? (settings?.timezone ?? 'UTC') : (settings?.timezone ?? 'UTC'),
      shared: (existing?.visibility ?? 'organisation') === 'organisation',
      isDefault: existing?.is_default ?? false,
    },
  });

  // Keep the timezone default in sync once settings load.
  useEffect(() => {
    if (settings?.timezone) {
      reset((current) => ({ ...current, timezone: current.timezone || settings.timezone }), { keepDirty: true });
    }
  }, [settings?.timezone, reset]);

  const onSubmit = async (values: DashboardFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      visibility: values.shared ? ('organisation' as const) : ('private' as const),
      is_default: values.isDefault,
      refresh_seconds: values.refresh,
    };
    try {
      if (settings?.can_edit && values.timezone !== settings.timezone) await updateSettings(values.timezone);
      if (existing) {
        await update({ dashboardId: existing.id, values: payload });
        toast({ variant: 'success', title: 'Dashboard updated' });
        onClose();
      } else {
        const created = await create({
          ...payload,
          scope: target.scope,
          location_id: target.scope === 'location' ? target.locationId : null,
          device_id: target.scope === 'device' ? target.deviceId : null,
        });
        toast({ variant: 'success', title: 'Dashboard created' });
        onCreated(created.id);
      }
    } catch (cause: unknown) {
      setError('root', { message: cause instanceof Error ? cause.message : 'Unable to save dashboard.' });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{existing ? 'Dashboard settings' : 'New dashboard'}</DialogTitle>
        <DialogDescription>
          {existing ? 'Rename the dashboard or change who sees it.' : 'Start empty, then add widgets.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4" noValidate>
        <Field>
          <FieldLabel htmlFor="dashboard-name" required>
            Name
          </FieldLabel>
          <Input
            id="dashboard-name"
            maxLength={160}
            placeholder="e.g. Line 2 overview"
            disabled={isSaving}
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="dashboard-description">Description</FieldLabel>
          <Textarea
            id="dashboard-description"
            maxLength={2000}
            rows={2}
            disabled={isSaving}
            {...register('description')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dashboard-refresh">Refresh</FieldLabel>
          <Controller
            name="refresh"
            control={control}
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger id="dashboard-refresh" className="w-full" ref={field.ref}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {settings?.can_edit && (
          <Field>
            <FieldLabel htmlFor="dashboard-timezone">Organisation timezone</FieldLabel>
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="dashboard-timezone" className="w-full" ref={field.ref}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone.replaceAll('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-muted-foreground text-xs">Used for days, weeks and chart times on every dashboard.</p>
          </Field>
        )}
        <div className="space-y-2">
          <Controller
            name="shared"
            control={control}
            render={({ field }) => (
              <CheckboxField
                id="dashboard-shared"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSaving}
              >
                Visible to everyone in the organisation
              </CheckboxField>
            )}
          />
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <CheckboxField
                id="dashboard-default"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSaving}
              >
                Open this dashboard by default
              </CheckboxField>
            )}
          />
        </div>
        {errors.root?.message && <FieldError>{errors.root.message}</FieldError>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} loadingText={existing ? 'Saving…' : 'Creating…'}>
            {existing ? 'Save' : 'Create dashboard'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
