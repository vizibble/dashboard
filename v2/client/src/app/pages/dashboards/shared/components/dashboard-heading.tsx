import { GearSixIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import type { LayoutEditor } from '@/app/pages/dashboards/shared/hooks/use-layout-editor';
import type { Dashboard, DashboardDetail } from '@/app/pages/dashboards/shared/types';
import { PageHeader, type PageMenuItem } from '@/app/shared/components/layout/page-header';
import { Button } from '@/app/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';
import { Spinner } from '@/app/shared/components/ui/spinner';

type DashboardHeadingProps = {
  /** `page` owns the sticky page header; `section` sits under an existing record page. */
  variant: 'page' | 'section';
  title: string;
  dashboards: Dashboard[];
  dashboard: DashboardDetail | undefined;
  selectedId: string | undefined;
  onSelect: (dashboardId: string) => void;
  layout: LayoutEditor;
  canCreate: boolean;
  onAddWidget: () => void;
  onCreateDashboard: () => void;
  onOpenSettings: (dashboard: DashboardDetail) => void;
  onDeleteDashboard: () => void;
};

export function DashboardHeading(props: DashboardHeadingProps) {
  const { variant, title, dashboards, dashboard, layout, canCreate, onCreateDashboard, onOpenSettings } =
    props;

  const hasDashboards = dashboards.length > 0;

  const name = dashboard?.name ?? title;

  if (variant === 'page') {
    return (
      <PageHeader
        title={name}
        description={
          layout.editing
            ? 'Editing — drag widgets to reorder, resize them, then save.'
            : (dashboard?.description ?? undefined)
        }
        actions={hasDashboards ? <DashboardActions {...props} /> : undefined}
        menu={hasDashboards ? dashboardMenu(props) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{name}</h2>
        {layout.editing && (
          <p className="text-muted-foreground text-xs">Editing — drag to reorder, resize, then save.</p>
        )}
      </div>
      {hasDashboards && (
        <div className="flex flex-wrap items-center gap-2">
          <DashboardActions {...props} />
          {!layout.editing && canCreate && (
            <Button variant="ghost" size="sm" onClick={onCreateDashboard}>
              <PlusIcon aria-hidden="true" />
              New
            </Button>
          )}
          {!layout.editing && dashboard?.can_edit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Dashboard settings"
              onClick={() => onOpenSettings(dashboard)}
            >
              <GearSixIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Overflow menu for the page header. Empty while editing the layout. */
function dashboardMenu({
  dashboard,
  layout,
  canCreate,
  onCreateDashboard,
  onOpenSettings,
  onDeleteDashboard,
}: DashboardHeadingProps): PageMenuItem[] {
  const menu: PageMenuItem[] = [];

  if (layout.editing) {
    return menu;
  }
  if (canCreate) {
    menu.push({
      label: 'New dashboard',
      icon: PlusIcon,
      onSelect: onCreateDashboard,
    });
  }
  if (dashboard?.can_edit) {
    menu.push(
      {
        label: 'Settings',
        icon: GearSixIcon,
        onSelect: () => onOpenSettings(dashboard),
      },
      {
        label: 'Delete dashboard',
        icon: TrashIcon,
        destructive: true,
        onSelect: onDeleteDashboard,
      },
    );
  }

  return menu;
}

function DashboardActions({
  dashboards,
  dashboard,
  selectedId,
  onSelect,
  layout,
  onAddWidget,
}: DashboardHeadingProps) {
  if (layout.editing) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={onAddWidget}>
          <PlusIcon aria-hidden="true" />
          Add widget
        </Button>
        <Button variant="ghost" size="sm" onClick={layout.cancel} disabled={layout.isSaving}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void layout.save()} disabled={layout.isSaving}>
          {layout.isSaving && <Spinner aria-hidden="true" />}
          Save layout
        </Button>
      </>
    );
  }

  return (
    <>
      {dashboards.length > 1 && (
        <Select value={selectedId} onValueChange={onSelect}>
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
      )}
      {dashboard?.can_edit && (
        <Button variant="outline" size="sm" onClick={layout.start}>
          <PencilSimpleIcon aria-hidden="true" />
          Edit
        </Button>
      )}
    </>
  );
}
