import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import {
  useCreateDashboard,
  useUpdateDashboard,
} from '@/app/pages/dashboards/shared/hooks/use-dashboard-mutations';
import {
  useOrganisationSettings,
  useUpdateOrganisationSettings,
} from '@/app/pages/dashboards/shared/hooks/use-organisation-settings';
import {
  dashboardFormDefaults,
  dashboardFormSchema,
  toCreateDashboardInput,
  toDashboardInput,
  type DashboardFormValues,
} from '@/app/pages/dashboards/shared/lib/dashboard-form';
import type { DashboardDetail, DashboardTarget } from '@/app/pages/dashboards/shared/types';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

type UseDashboardFormOptions = {
  target: DashboardTarget;
  existing: DashboardDetail | null;
  onClose: () => void;
  onCreated: (dashboardId: string) => void;
};

/** Create/settings form for a dashboard. Also saves the organisation timezone when it changed. */
export function useDashboardForm({ target, existing, onClose, onCreated }: UseDashboardFormOptions) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync: create, isPending: isCreating } = useCreateDashboard(organisation.id);

  const { mutateAsync: update, isPending: isUpdating } = useUpdateDashboard(organisation.id);

  const { data: settings } = useOrganisationSettings(organisation.id);

  const { mutateAsync: updateSettings, isPending: isUpdatingSettings } = useUpdateOrganisationSettings(
    organisation.id,
  );

  const form = useForm<DashboardFormValues>({
    resolver: zodResolver(dashboardFormSchema),
    defaultValues: dashboardFormDefaults(existing, settings?.timezone ?? 'UTC'),
  });

  const { reset, setError } = form;

  // Keep the timezone default in sync once settings load.
  useEffect(() => {
    if (!settings?.timezone) {
      return;
    }
    reset(
      (current) => ({
        ...current,
        timezone: current.timezone || settings.timezone,
      }),
      { keepDirty: true },
    );
  }, [settings?.timezone, reset]);

  const saveTimezone = async (timezone: string) => {
    if (!settings?.can_edit || timezone === settings.timezone) {
      return;
    }
    await updateSettings(timezone);
  };

  const save = async (values: DashboardFormValues) => {
    await saveTimezone(values.timezone);
    if (existing) {
      await update({
        dashboardId: existing.id,
        values: toDashboardInput(values),
      });
      toast({ variant: 'success', title: 'Dashboard updated' });
      onClose();

      return;
    }
    const created = await create(toCreateDashboardInput(values, target));

    toast({ variant: 'success', title: 'Dashboard created' });
    onCreated(created.id);
  };

  const onSubmit = async (values: DashboardFormValues) => {
    try {
      await save(values);
    } catch (cause: unknown) {
      setError('root', {
        message: getErrorMessage(cause, 'Unable to save dashboard.'),
      });
    }
  };

  return {
    form,
    settings,
    onSubmit: form.handleSubmit(onSubmit),
    isSaving: isCreating || isUpdating || isUpdatingSettings,
  };
}
