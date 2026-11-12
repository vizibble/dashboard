import {
  analyticsBatchResultSchema,
  deviceStatusListSchema,
  discoveredMetricSchema,
} from '@vizibble/shared/analytics';
import { dashboardDetailSchema, dashboardSchema } from '@vizibble/shared/dashboards';
import { buildPath, routes } from '@vizibble/shared/routes';
import { organisationSettingsSchema } from '@vizibble/shared/settings';

import type {
  AnalyticsQuery,
  CreateDashboardInput,
  DashboardTarget,
  UpdateDashboardInput,
  WidgetInput,
  WidgetLayoutInput,
} from '@/app/pages/dashboards/shared/types';
import { api } from '@/app/shared/utils/api-request';

/** Query params for a dashboard list: the scope plus the record it belongs to. */
function dashboardListParams(target: DashboardTarget): Record<string, string> {
  if (target.scope === 'location') {
    return { scope: target.scope, location_id: target.locationId };
  }
  if (target.scope === 'device') {
    return { scope: target.scope, device_id: target.deviceId };
  }

  return { scope: target.scope };
}

export function getDashboards(organisationId: string, target: DashboardTarget, signal?: AbortSignal) {
  const params = dashboardListParams(target);

  return api.get(buildPath(routes.dashboards.collection, { organisationId }), dashboardSchema.array(), {
    signal,
    params,
  });
}

export function getDashboard(organisationId: string, dashboardId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.dashboards.item, { organisationId, dashboardId }), dashboardDetailSchema, {
    signal,
  });
}

export function createDashboard(organisationId: string, values: CreateDashboardInput) {
  return api.post(buildPath(routes.dashboards.collection, { organisationId }), values, dashboardDetailSchema);
}

export function updateDashboard(organisationId: string, dashboardId: string, values: UpdateDashboardInput) {
  return api.patch(
    buildPath(routes.dashboards.item, { organisationId, dashboardId }),
    values,
    dashboardDetailSchema,
  );
}

export function deleteDashboard(organisationId: string, dashboardId: string) {
  return api.delete(buildPath(routes.dashboards.item, { organisationId, dashboardId }));
}

export function createWidget(organisationId: string, dashboardId: string, values: WidgetInput) {
  return api.post(
    buildPath(routes.dashboards.widgets, { organisationId, dashboardId }),
    values,
    dashboardDetailSchema,
  );
}

export function updateWidget(
  organisationId: string,
  dashboardId: string,
  widgetId: string,
  values: WidgetInput,
) {
  return api.put(
    buildPath(routes.dashboards.widget, {
      organisationId,
      dashboardId,
      widgetId,
    }),
    values,
    dashboardDetailSchema,
  );
}

export function deleteWidget(organisationId: string, dashboardId: string, widgetId: string) {
  return api.delete(
    buildPath(routes.dashboards.widget, {
      organisationId,
      dashboardId,
      widgetId,
    }),
  );
}

export function saveLayout(organisationId: string, dashboardId: string, values: WidgetLayoutInput) {
  return api.put(
    buildPath(routes.dashboards.layout, { organisationId, dashboardId }),
    values,
    dashboardDetailSchema,
  );
}

export function runAnalytics(organisationId: string, queries: AnalyticsQuery[], signal?: AbortSignal) {
  return api.post(
    buildPath(routes.analytics.query, { organisationId }),
    { queries },
    analyticsBatchResultSchema,
    {
      signal,
    },
  );
}

export function discoverMetrics(
  organisationId: string,
  scope: AnalyticsQuery['scope'],
  signal?: AbortSignal,
) {
  return api.post(
    buildPath(routes.analytics.metrics, { organisationId }),
    { scope },
    discoveredMetricSchema.array(),
    {
      signal,
    },
  );
}

export function getDeviceStatus(organisationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.analytics.devices, { organisationId }), deviceStatusListSchema, { signal });
}

export function getOrganisationSettings(organisationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.settings.item, { organisationId }), organisationSettingsSchema, { signal });
}

export function updateOrganisationSettings(organisationId: string, timezone: string) {
  return api.patch(
    buildPath(routes.settings.item, { organisationId }),
    { timezone },
    organisationSettingsSchema,
  );
}
