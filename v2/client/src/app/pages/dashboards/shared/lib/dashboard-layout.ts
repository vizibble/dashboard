import type {
  DashboardDetail,
  DashboardFilters,
  Widget,
  WidgetLayoutInput,
} from '@/app/pages/dashboards/shared/types';

export type LayoutItem = Pick<Widget, 'id' | 'width' | 'height'>;

/** The filters a dashboard opens with: its saved time range and no location/device narrowing. */
export function filtersFromDashboard(dashboard: DashboardDetail): DashboardFilters {
  return {
    timeRange: dashboard.time_range,
    timeFrom: dashboard.time_from?.toISOString() ?? null,
    timeTo: dashboard.time_to?.toISOString() ?? null,
    locationId: null,
    deviceId: null,
  };
}

export function isCustomRangeIncomplete(filters: DashboardFilters) {
  return filters.timeRange === 'custom' && (!filters.timeFrom || !filters.timeTo);
}

/** Fixed past ranges never change; only live ranges are refreshed. */
export function dataRefreshSeconds(filters: DashboardFilters, dashboard: DashboardDetail) {
  if (filters.timeRange === 'custom' || filters.timeRange === 'yesterday') {
    return 0;
  }

  return dashboard.refresh_seconds;
}

/**
 * Widgets in display order with unsaved layout changes applied. Widgets added while
 * editing go last; removed ones drop out of the draft.
 */
export function applyLayoutDraft(widgets: Widget[], draft: LayoutItem[]): Widget[] {
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));

  const ordered: Widget[] = [];

  for (const item of draft) {
    const widget = byId.get(item.id);

    if (widget) {
      ordered.push({ ...widget, width: item.width, height: item.height });
    }
  }
  const added = widgets.filter((widget) => !draft.some((item) => item.id === widget.id));

  return [...ordered, ...added];
}

export function toLayoutItems(widgets: LayoutItem[]): LayoutItem[] {
  return widgets.map(({ id, width, height }) => ({ id, width, height }));
}

/** Moves one item to a new position; out-of-range moves leave the order unchanged. */
export function moveLayoutItem(items: LayoutItem[], id: string, toIndex: number): LayoutItem[] {
  const from = items.findIndex((item) => item.id === id);

  if (from < 0 || toIndex < 0 || toIndex >= items.length || from === toIndex) {
    return items;
  }
  const next = [...items];

  const [moved] = next.splice(from, 1);

  if (!moved) {
    return items;
  }
  next.splice(toIndex, 0, moved);

  return next;
}

export function resizeLayoutItem(
  items: LayoutItem[],
  id: string,
  size: { width?: number; height?: number },
): LayoutItem[] {
  return items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      id: item.id,
      width: size.width ?? item.width,
      height: size.height ?? item.height,
    };
  });
}

export function toLayoutInput(items: LayoutItem[]): WidgetLayoutInput {
  return {
    widgets: items.map((item, index) => ({
      id: item.id,
      sort_order: index,
      width: item.width,
      height: item.height,
    })),
  };
}
