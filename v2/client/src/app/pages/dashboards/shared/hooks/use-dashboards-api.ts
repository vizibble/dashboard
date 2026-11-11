import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDashboard,
  createWidget,
  deleteDashboard,
  deleteWidget,
  discoverMetrics,
  getDashboard,
  getDashboards,
  getDeviceStatus,
  getOrganisationSettings,
  runAnalytics,
  saveLayout,
  updateDashboard,
  updateOrganisationSettings,
  updateWidget,
} from '@/app/pages/dashboards/shared/api';
import type {
  AnalyticsQuery,
  CreateDashboardInput,
  DashboardDetail,
  DashboardTarget,
  UpdateDashboardInput,
  WidgetInput,
  WidgetLayoutInput,
} from '@/app/pages/dashboards/shared/types';

// Cache keys for dashboard and analytics queries.
export const dashboardQueryKeys = {
  all: ['dashboards'] as const,
  list: (organisationId: string, target: DashboardTarget) => ['dashboards', 'list', organisationId, target] as const,
  detail: (organisationId: string, dashboardId: string) =>
    ['dashboards', 'detail', organisationId, dashboardId] as const,
  analytics: (organisationId: string, queries: AnalyticsQuery[]) => ['analytics', organisationId, queries] as const,
  metrics: (organisationId: string, scope: AnalyticsQuery['scope']) =>
    ['analytics', 'metrics', organisationId, scope] as const,
  deviceStatus: (organisationId: string) => ['analytics', 'devices', organisationId] as const,
  settings: (organisationId: string) => ['settings', organisationId] as const,
};

// Dashboards saved for one organisation, location or device.
export function useFetchDashboards(organisationId: string, target: DashboardTarget) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.list(organisationId, target),
    queryFn: ({ signal }) => getDashboards(organisationId, target, signal),
  });
  return { ...query, dashboards: query.data ?? [] };
}

// One dashboard with its widgets.
export function useFetchDashboard(organisationId: string, dashboardId: string | undefined) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.detail(organisationId, dashboardId ?? ''),
    queryFn: ({ signal }) => getDashboard(organisationId, dashboardId!, signal),
    enabled: Boolean(dashboardId),
  });
  return { ...query, dashboard: query.data };
}

/** Every widget's data in one request. Identical queries are de-duplicated by the server. */
export function useDashboardData(organisationId: string, queries: AnalyticsQuery[], refreshSeconds: number) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.analytics(organisationId, queries),
    queryFn: ({ signal }) => runAnalytics(organisationId, queries, signal),
    enabled: queries.length > 0,
    placeholderData: keepPreviousData,
    refetchInterval: refreshSeconds > 0 ? refreshSeconds * 1000 : false,
    refetchIntervalInBackground: false,
  });
  return { ...query, results: query.data?.results ?? [], timezone: query.data?.timezone };
}

// Parameters available on the devices in a scope.
export function useDiscoverMetrics(organisationId: string, scope: AnalyticsQuery['scope'], enabled = true) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.metrics(organisationId, scope),
    queryFn: ({ signal }) => discoverMetrics(organisationId, scope, signal),
    enabled,
    staleTime: 60_000,
  });
  return { ...query, metrics: query.data ?? [] };
}

// Connectivity of every device, from when each last communicated.
export function useDeviceStatus(organisationId: string, refreshSeconds = 60) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.deviceStatus(organisationId),
    queryFn: ({ signal }) => getDeviceStatus(organisationId, signal),
    refetchInterval: refreshSeconds > 0 ? refreshSeconds * 1000 : false,
  });
  return { ...query, devices: query.data?.devices ?? [], offlineAfterSeconds: query.data?.offline_after_seconds };
}

export function useOrganisationSettings(organisationId: string) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.settings(organisationId),
    queryFn: ({ signal }) => getOrganisationSettings(organisationId, signal),
    staleTime: 5 * 60_000,
  });
  return { ...query, settings: query.data };
}

export function useUpdateOrganisationSettings(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (timezone: string) => updateOrganisationSettings(organisationId, timezone),
    onSuccess: async (settings) => {
      queryClient.setQueryData(dashboardQueryKeys.settings(organisationId), settings);
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
  return { ...mutation, isUpdating: mutation.isPending };
}

/** Every dashboard mutation returns the full dashboard; store it and refresh lists. */
function useStoreDashboard(organisationId: string) {
  const queryClient = useQueryClient();
  return async (dashboard: DashboardDetail) => {
    queryClient.setQueryData(dashboardQueryKeys.detail(organisationId, dashboard.id), dashboard);
    await queryClient.invalidateQueries({ queryKey: [...dashboardQueryKeys.all, 'list', organisationId] });
  };
}

export function useCreateDashboard(organisationId: string) {
  const store = useStoreDashboard(organisationId);
  const mutation = useMutation({
    mutationFn: (values: CreateDashboardInput) => createDashboard(organisationId, values),
    onSuccess: store,
  });
  return { ...mutation, isCreating: mutation.isPending };
}

export function useUpdateDashboard(organisationId: string) {
  const store = useStoreDashboard(organisationId);
  const mutation = useMutation({
    mutationFn: ({ dashboardId, values }: { dashboardId: string; values: UpdateDashboardInput }) =>
      updateDashboard(organisationId, dashboardId, values),
    onSuccess: store,
  });
  return { ...mutation, isUpdating: mutation.isPending };
}

export function useDeleteDashboard(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (dashboardId: string) => deleteDashboard(organisationId, dashboardId),
    onSuccess: async (_, dashboardId) => {
      queryClient.removeQueries({ queryKey: dashboardQueryKeys.detail(organisationId, dashboardId), exact: true });
      await queryClient.invalidateQueries({ queryKey: [...dashboardQueryKeys.all, 'list', organisationId] });
    },
  });
  return { ...mutation, isDeleting: mutation.isPending };
}

export function useSaveWidget(organisationId: string, dashboardId: string) {
  const store = useStoreDashboard(organisationId);
  const mutation = useMutation({
    mutationFn: ({ widgetId, values }: { widgetId?: string; values: WidgetInput }) =>
      widgetId
        ? updateWidget(organisationId, dashboardId, widgetId, values)
        : createWidget(organisationId, dashboardId, values),
    onSuccess: store,
  });
  return { ...mutation, isSaving: mutation.isPending };
}

export function useDeleteWidget(organisationId: string, dashboardId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (widgetId: string) => deleteWidget(organisationId, dashboardId, widgetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail(organisationId, dashboardId) });
    },
  });
  return { ...mutation, isDeleting: mutation.isPending };
}

export function useSaveLayout(organisationId: string, dashboardId: string) {
  const store = useStoreDashboard(organisationId);
  const mutation = useMutation({
    mutationFn: (values: WidgetLayoutInput) => saveLayout(organisationId, dashboardId, values),
    onSuccess: store,
  });
  return { ...mutation, isSaving: mutation.isPending };
}
