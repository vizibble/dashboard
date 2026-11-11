import { GearSixIcon, PencilSimpleIcon, PlusIcon, SquaresFourIcon, TrashIcon } from '@phosphor-icons/react';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { usePermission } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { DashboardDialog } from '@/app/pages/dashboards/shared/components/dashboard-dialog';
import { DashboardFilters } from '@/app/pages/dashboards/shared/components/dashboard-filters';
import { DeviceStatusStrip } from '@/app/pages/dashboards/shared/components/device-status-strip';
import { WidgetCard } from '@/app/pages/dashboards/shared/components/widget-card';
import { WidgetEditorDialog } from '@/app/pages/dashboards/shared/components/widget-editor-dialog';
import {
  useDashboardData,
  useDeleteDashboard,
  useDeleteWidget,
  useFetchDashboard,
  useFetchDashboards,
  useSaveLayout,
} from '@/app/pages/dashboards/shared/hooks/use-dashboards-api';
import { buildWidgetQuery, widgetToInput } from '@/app/pages/dashboards/shared/lib/build-query';
import type {
  DashboardDetail,
  DashboardTarget,
  DashboardFilters as Filters,
  Widget,
} from '@/app/pages/dashboards/shared/types';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { PageHeader, type PageMenuItem } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Button } from '@/app/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/ui/select';
import { Skeleton } from '@/app/shared/components/ui/skeleton';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { toast } from '@/app/shared/hooks/use-toast';

type DashboardWorkspaceProps = {
  target: DashboardTarget;
  /** `page` owns the sticky page header; `section` sits under an existing record page. */
  variant: 'page' | 'section';
  title?: string;
};

type LayoutItem = Pick<Widget, 'id' | 'width' | 'height'>;

function filtersFrom(dashboard: DashboardDetail): Filters {
  return {
    timeRange: dashboard.time_range,
    timeFrom: dashboard.time_from?.toISOString() ?? null,
    timeTo: dashboard.time_to?.toISOString() ?? null,
    locationId: null,
    deviceId: null,
  };
}

/**
 * One component for organisation, location and device dashboards: pick a dashboard,
 * filter it, view it, and (for editors) switch into edit mode to change its widgets.
 */
export function DashboardWorkspace({ target, variant, title = 'Dashboard' }: DashboardWorkspaceProps) {
  // Editing an existing dashboard is decided per dashboard by the API (`can_edit`).
  const canCreate = usePermission({ dashboard: ['create'] });
  const { organisation } = useOrganisationContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dashboards, isPending: isListPending, isError: isListError } = useFetchDashboards(organisation.id, target);

  const requestedId = searchParams.get('dashboard');
  const selectedId =
    dashboards.find((item) => item.id === requestedId)?.id ??
    dashboards.find((item) => item.is_default)?.id ??
    dashboards[0]?.id;
  const { dashboard, isPending: isDashboardPending } = useFetchDashboard(organisation.id, selectedId);

  const select = (dashboardId: string) =>
    setSearchParams(
      (params) => {
        params.set('dashboard', dashboardId);
        return params;
      },
      { replace: true },
    );

  // Filters and edit mode belong to one dashboard; switching dashboards starts fresh.
  const [filterState, setFilterState] = useState<{ dashboardId: string; filters: Filters } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [widgetTarget, setWidgetTarget] = useState<Widget | 'new' | null>(null);
  const [dashboardTarget, setDashboardTarget] = useState<DashboardDetail | 'new' | null>(null);
  const [removingWidget, setRemovingWidget] = useState<Widget | null>(null);
  const [removingDashboard, setRemovingDashboard] = useState(false);

  const { mutateAsync: saveLayout, isSaving: isSavingLayout } = useSaveLayout(organisation.id, selectedId ?? '');
  const { mutateAsync: deleteWidget, isDeleting: isDeletingWidget } = useDeleteWidget(
    organisation.id,
    selectedId ?? '',
  );
  const { mutateAsync: deleteDashboard, isDeleting: isDeletingDashboard } = useDeleteDashboard(organisation.id);

  const editing = Boolean(dashboard) && editingId === dashboard?.id;
  const activeFilters = dashboard
    ? filterState?.dashboardId === dashboard.id
      ? filterState.filters
      : filtersFrom(dashboard)
    : null;
  const setFilters = (filters: Filters) => dashboard && setFilterState({ dashboardId: dashboard.id, filters });

  // Widgets in display order with unsaved layout changes applied. Widgets added while
  // editing go last; removed ones drop out of the draft.
  const widgets = useMemo(() => {
    if (!dashboard) return [];
    if (!editing || !draft) return dashboard.widgets;
    const byId = new Map(dashboard.widgets.map((widget) => [widget.id, widget]));
    const ordered = draft.flatMap((item) => {
      const widget = byId.get(item.id);
      return widget ? [{ ...widget, width: item.width, height: item.height }] : [];
    });
    const added = dashboard.widgets.filter((widget) => !draft.some((item) => item.id === widget.id));
    return [...ordered, ...added];
  }, [dashboard, draft, editing]);
  const layoutOf = () => widgets.map(({ id, width, height }) => ({ id, width, height }));

  const queries = useMemo(
    () =>
      dashboard && activeFilters
        ? dashboard.widgets.map((widget) =>
            buildWidgetQuery(widget.id, widgetToInput(widget), dashboard, activeFilters),
          )
        : [],
    [activeFilters, dashboard],
  );
  const customRangeIncomplete =
    activeFilters?.timeRange === 'custom' && (!activeFilters.timeFrom || !activeFilters.timeTo);
  const data = useDashboardData(
    organisation.id,
    customRangeIncomplete ? [] : queries,
    // Fixed past ranges never change; only live ranges are refreshed.
    activeFilters?.timeRange === 'custom' || activeFilters?.timeRange === 'yesterday'
      ? 0
      : (dashboard?.refresh_seconds ?? 0),
  );
  const resultById = useMemo(() => new Map(data.results.map((result) => [result.id, result])), [data.results]);

  const startEditing = () => {
    setDraft(null);
    setEditingId(dashboard?.id ?? null);
  };
  const cancelEditing = () => {
    setDraft(null);
    setEditingId(null);
  };
  const updateDraft = (update: (items: LayoutItem[]) => LayoutItem[]) => setDraft(update(layoutOf()));

  const move = (id: string, toIndex: number) =>
    updateDraft((items) => {
      const from = items.findIndex((item) => item.id === id);
      if (from < 0 || toIndex < 0 || toIndex >= items.length || from === toIndex) return items;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved!);
      return next;
    });

  const saveEditing = async () => {
    if (!draft) return cancelEditing();
    try {
      await saveLayout({
        widgets: layoutOf().map((item, index) => ({
          id: item.id,
          sort_order: index,
          width: item.width,
          height: item.height,
        })),
      });
      toast({ variant: 'success', title: 'Layout saved' });
      cancelEditing();
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to save layout',
        description: cause instanceof Error ? cause.message : undefined,
      });
    }
  };

  const picker =
    dashboards.length > 1 ? (
      <Select value={selectedId} onValueChange={select} disabled={editing}>
        <SelectTrigger size="sm" className="w-48" aria-label="Dashboard">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dashboards.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
              {item.visibility === 'private' ? ' (only you)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  const actions = editing ? (
    <>
      <Button variant="outline" size="sm" onClick={() => setWidgetTarget('new')}>
        <PlusIcon aria-hidden="true" />
        Add widget
      </Button>
      <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSavingLayout}>
        Cancel
      </Button>
      <Button size="sm" onClick={() => void saveEditing()} disabled={isSavingLayout}>
        {isSavingLayout && <Spinner aria-hidden="true" />}
        Save layout
      </Button>
    </>
  ) : (
    <>
      {picker}
      {dashboard?.can_edit && (
        <Button variant="outline" size="sm" onClick={startEditing}>
          <PencilSimpleIcon aria-hidden="true" />
          Edit
        </Button>
      )}
    </>
  );

  const menu: PageMenuItem[] = editing
    ? []
    : [
        ...(canCreate ? [{ label: 'New dashboard', icon: PlusIcon, onSelect: () => setDashboardTarget('new') }] : []),
        ...(dashboard?.can_edit
          ? [
              { label: 'Settings', icon: GearSixIcon, onSelect: () => setDashboardTarget(dashboard) },
              {
                label: 'Delete dashboard',
                icon: TrashIcon,
                destructive: true,
                onSelect: () => setRemovingDashboard(true),
              },
            ]
          : []),
      ];

  const heading =
    variant === 'page' ? (
      <PageHeader
        title={dashboard?.name ?? title}
        description={
          editing ? 'Editing — drag widgets to reorder, resize them, then save.' : (dashboard?.description ?? undefined)
        }
        actions={dashboards.length > 0 ? actions : undefined}
        menu={dashboards.length > 0 ? menu : undefined}
      />
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{dashboard?.name ?? title}</h2>
          {editing && <p className="text-muted-foreground text-xs">Editing — drag to reorder, resize, then save.</p>}
        </div>
        {dashboards.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {!editing && canCreate && (
              <Button variant="ghost" size="sm" onClick={() => setDashboardTarget('new')}>
                <PlusIcon aria-hidden="true" />
                New
              </Button>
            )}
            {!editing && dashboard?.can_edit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Dashboard settings"
                onClick={() => setDashboardTarget(dashboard)}
              >
                <GearSixIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    );

  let body: ReactNode;
  if (isListPending || (selectedId && isDashboardPending)) {
    body = (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-12 gap-3">
          <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
          <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
          <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
        </div>
      </div>
    );
  } else if (isListError) {
    body = (
      <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
        <ErrorState
          title="Dashboards unavailable"
          message="We couldn't load your dashboards. Please verify your connection."
          variant="inline"
        />
      </div>
    );
  } else if (!dashboard || !activeFilters) {
    body = (
      <div className="bg-card rounded-lg border">
        <EmptyState
          icon={SquaresFourIcon}
          title="No dashboards yet"
          description={
            canCreate
              ? "Create a dashboard and add charts, values and maps from your devices' data."
              : 'No dashboards have been shared with you yet.'
          }
          action={
            canCreate ? (
              <Button size="sm" onClick={() => setDashboardTarget('new')}>
                <PlusIcon aria-hidden="true" />
                Create dashboard
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  } else {
    body = (
      <>
        <DashboardFilters
          dashboard={dashboard}
          filters={activeFilters}
          onChange={setFilters}
          timezone={data.timezone}
        />
        {widgets.length === 0 ? (
          <div className="bg-card rounded-lg border">
            <EmptyState
              icon={SquaresFourIcon}
              title="This dashboard is empty"
              description={dashboard.can_edit ? 'Add a widget to start showing data.' : 'Nothing has been added yet.'}
              action={
                dashboard.can_edit ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!editing) startEditing();
                      setWidgetTarget('new');
                    }}
                  >
                    <PlusIcon aria-hidden="true" />
                    Add widget
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-12 gap-3">
            {widgets.map((widget, index) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                result={resultById.get(widget.id)}
                isLoading={data.isFetching}
                isError={data.isError}
                editing={editing}
                isFirst={index === 0}
                isLast={index === widgets.length - 1}
                isDragging={dragging === widget.id}
                onEdit={() => setWidgetTarget(widget)}
                onDelete={() => setRemovingWidget(widget)}
                onResize={(size) =>
                  updateDraft((items) => items.map((item) => (item.id === widget.id ? { ...item, ...size } : item)))
                }
                onMove={(direction) => move(widget.id, index + direction)}
                onDragStart={() => setDragging(widget.id)}
                onDragEnter={() => dragging && dragging !== widget.id && move(dragging, index)}
                onDragEnd={() => setDragging(null)}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {heading}
      {target.scope !== 'device' && variant === 'page' && (
        <DeviceStatusStrip target={target} refreshSeconds={dashboard?.refresh_seconds ?? 60} />
      )}
      {target.scope === 'location' && variant === 'section' && (
        <DeviceStatusStrip target={target} refreshSeconds={dashboard?.refresh_seconds ?? 60} />
      )}
      {target.scope === 'device' && (
        <DeviceStatusStrip target={target} refreshSeconds={dashboard?.refresh_seconds ?? 60} />
      )}
      {body}

      {dashboard && activeFilters && (
        <WidgetEditorDialog
          dashboard={dashboard}
          filters={activeFilters}
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
      <ConfirmDialog
        open={removingWidget !== null}
        onClose={() => setRemovingWidget(null)}
        onConfirm={() => {
          if (!removingWidget) return;
          void deleteWidget(removingWidget.id)
            .then(() => toast({ variant: 'success', title: 'Widget removed' }))
            .finally(() => setRemovingWidget(null));
        }}
        title="Remove widget?"
        description={`"${removingWidget?.title ?? ''}" will be removed from this dashboard. Device data is not affected.`}
        confirmLabel="Remove"
        destructive
        isPending={isDeletingWidget}
      />
      <ConfirmDialog
        open={removingDashboard}
        onClose={() => setRemovingDashboard(false)}
        onConfirm={() => {
          if (!dashboard) return;
          void deleteDashboard(dashboard.id)
            .then(() => {
              toast({ variant: 'success', title: 'Dashboard deleted' });
              setSearchParams(
                (params) => {
                  params.delete('dashboard');
                  return params;
                },
                { replace: true },
              );
            })
            .finally(() => setRemovingDashboard(false));
        }}
        title="Delete dashboard?"
        description={`"${dashboard?.name ?? ''}" and its widgets will be deleted for everyone. Device data is not affected.`}
        confirmLabel="Delete dashboard"
        destructive
        isPending={isDeletingDashboard}
      />
    </>
  );
}
