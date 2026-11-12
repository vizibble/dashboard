import { z } from 'zod';

import type {
  CreateDashboardInput,
  DashboardDetail,
  DashboardTarget,
} from '@/app/pages/dashboards/shared/types';

export const dashboardFormSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(160),
  description: z.string().max(2000).optional(),
  refresh: z.number(),
  timezone: z.string(),
  shared: z.boolean(),
  isDefault: z.boolean(),
});

export type DashboardFormValues = z.infer<typeof dashboardFormSchema>;

export function dashboardFormDefaults(
  existing: DashboardDetail | null,
  timezone: string,
): DashboardFormValues {
  return {
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    refresh: existing?.refresh_seconds ?? 60,
    timezone,
    shared: (existing?.visibility ?? 'organisation') === 'organisation',
    isDefault: existing?.is_default ?? false,
  };
}

type DashboardSettingsInput = Pick<
  CreateDashboardInput,
  'name' | 'description' | 'visibility' | 'is_default' | 'refresh_seconds'
>;

export function toDashboardInput(values: DashboardFormValues): DashboardSettingsInput {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || null,
    visibility: values.shared ? 'organisation' : 'private',
    is_default: values.isDefault,
    refresh_seconds: values.refresh,
  };
}

/** A new dashboard belongs to the organisation, location or device it was created on. */
export function toCreateDashboardInput(
  values: DashboardFormValues,
  target: DashboardTarget,
): CreateDashboardInput {
  const input = {
    ...toDashboardInput(values),
    scope: target.scope,
    location_id: null,
    device_id: null,
  };

  if (target.scope === 'location') {
    return { ...input, location_id: target.locationId };
  }
  if (target.scope === 'device') {
    return { ...input, device_id: target.deviceId };
  }

  return input;
}
