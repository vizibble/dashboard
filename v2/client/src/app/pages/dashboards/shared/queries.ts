import { queryOptions } from '@tanstack/react-query';

import {
  discoverMetrics,
  getDashboard,
  getDashboards,
  getDeviceStatus,
  getOrganisationSettings,
  runAnalytics,
} from '@/app/pages/dashboards/shared/api';
import type { AnalyticsQuery, DashboardTarget } from '@/app/pages/dashboards/shared/types';

/** Query definitions for dashboards. Keys: ['dashboards', organisationId, scope, ...params]. */
export const dashboardQueries = {
  all: (organisationId: string) => ['dashboards', organisationId] as const,
  lists: (organisationId: string) => [...dashboardQueries.all(organisationId), 'list'] as const,
  list: (organisationId: string, target: DashboardTarget) =>
    queryOptions({
      queryKey: [...dashboardQueries.lists(organisationId), target] as const,
      queryFn: ({ signal }) => getDashboards(organisationId, target, signal),
    }),
  detail: (organisationId: string, dashboardId: string) =>
    queryOptions({
      queryKey: [...dashboardQueries.all(organisationId), 'detail', dashboardId] as const,
      queryFn: ({ signal }) => getDashboard(organisationId, dashboardId, signal),
    }),
};

/** Query definitions for analytics. Keys: ['analytics', organisationId, scope, ...params]. */
export const analyticsQueries = {
  all: (organisationId: string) => ['analytics', organisationId] as const,
  data: (organisationId: string, queries: AnalyticsQuery[]) =>
    queryOptions({
      queryKey: [...analyticsQueries.all(organisationId), 'data', queries] as const,
      queryFn: ({ signal }) => runAnalytics(organisationId, queries, signal),
    }),
  metrics: (organisationId: string, scope: AnalyticsQuery['scope']) =>
    queryOptions({
      queryKey: [...analyticsQueries.all(organisationId), 'metrics', scope] as const,
      queryFn: ({ signal }) => discoverMetrics(organisationId, scope, signal),
      staleTime: 60_000,
    }),
  deviceStatus: (organisationId: string) =>
    queryOptions({
      queryKey: [...analyticsQueries.all(organisationId), 'devices'] as const,
      queryFn: ({ signal }) => getDeviceStatus(organisationId, signal),
    }),
};

/** Query definitions for organisation settings. Keys: ['settings', organisationId, scope]. */
export const organisationSettingsQueries = {
  all: (organisationId: string) => ['settings', organisationId] as const,
  detail: (organisationId: string) =>
    queryOptions({
      queryKey: [...organisationSettingsQueries.all(organisationId), 'detail'] as const,
      queryFn: ({ signal }) => getOrganisationSettings(organisationId, signal),
      staleTime: 5 * 60_000,
    }),
};
