import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createDashboard,
  createWidget,
  deleteDashboard,
  deleteWidget,
  saveLayout,
  updateDashboard,
  updateWidget,
} from '@/app/pages/dashboards/shared/api';
import { dashboardQueries } from '@/app/pages/dashboards/shared/queries';
import type {
  CreateDashboardInput,
  DashboardDetail,
  UpdateDashboardInput,
  WidgetInput,
  WidgetLayoutInput,
} from '@/app/pages/dashboards/shared/types';

/** Every dashboard mutation returns the full dashboard; store it and refresh lists. */
function useStoreDashboard(organisationId: string) {
  const queryClient = useQueryClient();

  return async (dashboard: DashboardDetail) => {
    queryClient.setQueryData(dashboardQueries.detail(organisationId, dashboard.id).queryKey, dashboard);
    await queryClient.invalidateQueries({
      queryKey: dashboardQueries.lists(organisationId),
    });
  };
}

export function useCreateDashboard(organisationId: string) {
  const store = useStoreDashboard(organisationId);

  return useMutation({
    mutationFn: (values: CreateDashboardInput) => createDashboard(organisationId, values),
    onSuccess: store,
  });
}

export function useUpdateDashboard(organisationId: string) {
  const store = useStoreDashboard(organisationId);

  return useMutation({
    mutationFn: ({ dashboardId, values }: { dashboardId: string; values: UpdateDashboardInput }) =>
      updateDashboard(organisationId, dashboardId, values),
    onSuccess: store,
  });
}

export function useDeleteDashboard(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dashboardId: string) => deleteDashboard(organisationId, dashboardId),
    onSuccess: async (_, dashboardId) => {
      queryClient.removeQueries({
        queryKey: dashboardQueries.detail(organisationId, dashboardId).queryKey,
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardQueries.lists(organisationId),
      });
    },
  });
}

/** Creates the widget, or updates it when an id is given. */
export function useSaveWidget(organisationId: string, dashboardId: string) {
  const store = useStoreDashboard(organisationId);

  return useMutation({
    mutationFn: ({ widgetId, values }: { widgetId?: string; values: WidgetInput }) => {
      if (widgetId) {
        return updateWidget(organisationId, dashboardId, widgetId, values);
      }

      return createWidget(organisationId, dashboardId, values);
    },
    onSuccess: store,
  });
}

export function useDeleteWidget(organisationId: string, dashboardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(organisationId, dashboardId, widgetId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: dashboardQueries.detail(organisationId, dashboardId).queryKey,
      }),
  });
}

export function useSaveLayout(organisationId: string, dashboardId: string) {
  const store = useStoreDashboard(organisationId);

  return useMutation({
    mutationFn: (values: WidgetLayoutInput) => saveLayout(organisationId, dashboardId, values),
    onSuccess: store,
  });
}
