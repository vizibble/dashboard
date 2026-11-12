import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import { analyticsQueries, dashboardQueries } from '@/app/pages/dashboards/shared/queries';
import type { AnalyticsQuery, DashboardTarget } from '@/app/pages/dashboards/shared/types';

/** Polling interval in ms, or false when refresh is off. */
function refetchEvery(refreshSeconds: number) {
  if (refreshSeconds > 0) {
    return refreshSeconds * 1000;
  }

  return false as const;
}

// Dashboards saved for one organisation, location or device.
export function useFetchDashboards(organisationId: string, target: DashboardTarget) {
  const query = useQuery(dashboardQueries.list(organisationId, target));

  return query;
}

// One dashboard with its widgets.
export function useFetchDashboard(organisationId: string, dashboardId: string | undefined) {
  const options = dashboardQueries.detail(organisationId, dashboardId ?? '');

  const query = useQuery({
    ...options,
    queryFn: dashboardId ? options.queryFn : skipToken,
  });

  return query;
}

/** Every widget's data in one request. Identical queries are de-duplicated by the server. */
export function useDashboardData(organisationId: string, queries: AnalyticsQuery[], refreshSeconds: number) {
  const options = analyticsQueries.data(organisationId, queries);

  const query = useQuery({
    ...options,
    queryFn: queries.length > 0 ? options.queryFn : skipToken,
    placeholderData: keepPreviousData,
    refetchInterval: refetchEvery(refreshSeconds),
    refetchIntervalInBackground: false,
  });

  return query;
}

// Parameters available on the devices in a scope.
export function useDiscoverMetrics(organisationId: string, scope: AnalyticsQuery['scope'], enabled = true) {
  const options = analyticsQueries.metrics(organisationId, scope);

  const query = useQuery({
    ...options,
    queryFn: enabled ? options.queryFn : skipToken,
  });

  return query;
}

// Connectivity of every device, from when each last communicated.
export function useDeviceStatus(organisationId: string, refreshSeconds = 60) {
  const query = useQuery({
    ...analyticsQueries.deviceStatus(organisationId),
    refetchInterval: refetchEvery(refreshSeconds),
  });

  return query;
}
