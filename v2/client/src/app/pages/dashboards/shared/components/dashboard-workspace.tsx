import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { usePermission } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { DashboardDialog } from '@/app/pages/dashboards/shared/components/dashboard-dialog';
import { DashboardFilters } from '@/app/pages/dashboards/shared/components/dashboard-filters';
import { DashboardHeading } from '@/app/pages/dashboards/shared/components/dashboard-heading';
import {
  DashboardSkeleton,
  DashboardsError,
  EmptyDashboard,
  NoDashboards,
} from '@/app/pages/dashboards/shared/components/dashboard-states';
import { DeleteDashboardDialog } from '@/app/pages/dashboards/shared/components/delete-dashboard-dialog';
import { DeviceStatusStrip } from '@/app/pages/dashboards/shared/components/device-status-strip';
import { RemoveWidgetDialog } from '@/app/pages/dashboards/shared/components/remove-widget-dialog';
import { WidgetEditorDialog } from '@/app/pages/dashboards/shared/components/widget-editor-dialog';
import { WidgetGrid } from '@/app/pages/dashboards/shared/components/widget-grid';
import { useDashboardFilters } from '@/app/pages/dashboards/shared/hooks/use-dashboard-filters';
import {
  useDashboardData,
  useFetchDashboard,
  useFetchDashboards,
} from '@/app/pages/dashboards/shared/hooks/use-dashboard-queries';
import { useDashboardSelection } from '@/app/pages/dashboards/shared/hooks/use-dashboard-selection';
import { useLayoutEditor } from '@/app/pages/dashboards/shared/hooks/use-layout-editor';
import { buildWidgetQuery, widgetToInput } from '@/app/pages/dashboards/shared/lib/build-query';
import {
  dataRefreshSeconds,
  isCustomRangeIncomplete,
} from '@/app/pages/dashboards/shared/lib/dashboard-layout';
import type { DashboardDetail, DashboardTarget, Widget } from '@/app/pages/dashboards/shared/types';

type DashboardWorkspaceProps = {
  target: DashboardTarget;
  /** `page` owns the sticky page header; `section` sits under an existing record page. */
  variant: 'page' | 'section';
  title?: string;
};

/** Organisation dashboards show the strip only as a page; locations and devices always do. */
function showsStatusStrip(target: DashboardTarget, variant: DashboardWorkspaceProps['variant']) {
  return target.scope !== 'organisation' || variant === 'page';
}

/**
 * One component for organisation, location and device dashboards: pick a dashboard,
 * filter it, view it, and (for editors) switch into edit mode to change its widgets.
 */
export function DashboardWorkspace({ target, variant, title = 'Dashboard' }: DashboardWorkspaceProps) {
  // Editing an existing dashboard is decided per dashboard by the API (`can_edit`).
  const canCreate = usePermission({ dashboard: ['create'] });

  const { organisation } = useOrganisationContext();

  const {
    data: dashboards = [],
    isPending: isListPending,
    isError: isListError,
  } = useFetchDashboards(organisation.id, target);

  const { selectedId, select, clear } = useDashboardSelection(dashboards);

  const { data: dashboard, isPending: isDashboardPending } = useFetchDashboard(organisation.id, selectedId);

  const { filters, setFilters } = useDashboardFilters(dashboard);

  const layout = useLayoutEditor(dashboard);

  const [widgetTarget, setWidgetTarget] = useState<Widget | 'new' | null>(null);

  const [dashboardTarget, setDashboardTarget] = useState<DashboardDetail | 'new' | null>(null);

  const [removingWidget, setRemovingWidget] = useState<Widget | null>(null);

  const [removingDashboard, setRemovingDashboard] = useState(false);

  const queries = useMemo(() => {
    if (!dashboard || !filters || isCustomRangeIncomplete(filters)) {
      return [];
    }

    return dashboard.widgets.map((widget) =>
      buildWidgetQuery(widget.id, widgetToInput(widget), dashboard, filters),
    );
  }, [dashboard, filters]);

  const dataQuery = useDashboardData(
    organisation.id,
    queries,
    dashboard && filters ? dataRefreshSeconds(filters, dashboard) : 0,
  );

  const resultById = useMemo(
    () => new Map((dataQuery.data?.results ?? []).map((result) => [result.id, result])),
    [dataQuery.data],
  );

  const addWidget = () => {
    if (!layout.editing) {
      layout.start();
    }
    setWidgetTarget('new');
  };

  const renderBody = () => {
    if (isListPending || (selectedId && isDashboardPending)) {
      return <DashboardSkeleton />;
    }
    if (isListError) {
      return <DashboardsError />;
    }
    if (!dashboard || !filters) {
      return <NoDashboards canCreate={canCreate} onCreate={() => setDashboardTarget('new')} />;
    }

    return (
      <>
        <DashboardFilters
          dashboard={dashboard}
          filters={filters}
          onChange={setFilters}
          timezone={dataQuery.data?.timezone}
        />
        {layout.widgets.length === 0 ? (
          <EmptyDashboard canEdit={dashboard.can_edit} onAddWidget={addWidget} />
        ) : (
          <WidgetGrid
            layout={layout}
            resultById={resultById}
            isLoading={dataQuery.isFetching}
            isError={dataQuery.isError}
            onEdit={setWidgetTarget}
            onDelete={setRemovingWidget}
          />
        )}
      </>
    );
  };

  return (
    <>
      <DashboardHeading
        variant={variant}
        title={title}
        dashboards={dashboards}
        dashboard={dashboard}
        selectedId={selectedId}
        onSelect={select}
        layout={layout}
        canCreate={canCreate}
        onAddWidget={() => setWidgetTarget('new')}
        onCreateDashboard={() => setDashboardTarget('new')}
        onOpenSettings={setDashboardTarget}
        onDeleteDashboard={() => setRemovingDashboard(true)}
      />
      {showsStatusStrip(target, variant) && (
        <DeviceStatusStrip target={target} refreshSeconds={dashboard?.refresh_seconds ?? 60} />
      )}
      {renderBody()}

      {dashboard && filters && (
        <WidgetEditorDialog
          dashboard={dashboard}
          filters={filters}
          target={widgetTarget}
          onClose={() => setWidgetTarget(null)}
        />
      )}
      <DashboardDialog
        target={target}
        dashboard={dashboardTarget}
        onClose={() => setDashboardTarget(null)}
        onCreated={(dashboardId) => {
          setDashboardTarget(null);
          select(dashboardId);
        }}
      />
      {dashboard && (
        <RemoveWidgetDialog
          dashboardId={dashboard.id}
          widget={removingWidget}
          onClose={() => setRemovingWidget(null)}
        />
      )}
      <DeleteDashboardDialog
        open={removingDashboard}
        dashboard={dashboard}
        onClose={() => setRemovingDashboard(false)}
        onDeleted={clear}
      />
    </>
  );
}
