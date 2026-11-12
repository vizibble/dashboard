import { useState } from 'react';

import { filtersFromDashboard } from '@/app/pages/dashboards/shared/lib/dashboard-layout';
import type { DashboardDetail, DashboardFilters } from '@/app/pages/dashboards/shared/types';

/** Filters belong to one dashboard; switching dashboards starts from its saved defaults. */
export function useDashboardFilters(dashboard: DashboardDetail | undefined) {
  const [state, setState] = useState<{
    dashboardId: string;
    filters: DashboardFilters;
  } | null>(null);

  const setFilters = (filters: DashboardFilters) => {
    if (!dashboard) {
      return;
    }
    setState({ dashboardId: dashboard.id, filters });
  };

  if (!dashboard) {
    return { filters: null, setFilters };
  }
  if (state?.dashboardId === dashboard.id) {
    return { filters: state.filters, setFilters };
  }

  return { filters: filtersFromDashboard(dashboard), setFilters };
}
