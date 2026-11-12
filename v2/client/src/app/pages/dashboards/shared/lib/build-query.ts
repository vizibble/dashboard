import type {
  AnalyticsQuery,
  DashboardDetail,
  DashboardFilters,
  Widget,
  WidgetInput,
} from '@/app/pages/dashboards/shared/types';

type WidgetConfig = Pick<
  WidgetInput,
  | 'type'
  | 'metric_key'
  | 'aggregation'
  | 'bucket_size'
  | 'split_by_device'
  | 'time_range'
  | 'time_from'
  | 'time_to'
  | 'latitude_metric'
  | 'longitude_metric'
  | 'sources'
>;

type DashboardOwner = Pick<DashboardDetail, 'device_id' | 'location_id'>;
type WidgetSource = NonNullable<WidgetInput['sources']>[number];
type AnalyticsScope = AnalyticsQuery['scope'];

/** The dashboard's own scope, narrowed by the location/device filter when one is chosen. */
export function dashboardScope(dashboard: DashboardOwner, filters: DashboardFilters) {
  if (filters.deviceId) {
    return {
      device_ids: [filters.deviceId],
      location_ids: [],
      include_child_locations: true,
    };
  }
  if (filters.locationId) {
    return {
      device_ids: [],
      location_ids: [filters.locationId],
      include_child_locations: true,
    };
  }
  const deviceIds: string[] = [];

  const locationIds: string[] = [];

  if (dashboard.device_id) {
    deviceIds.push(dashboard.device_id);
  }
  if (dashboard.location_id) {
    locationIds.push(dashboard.location_id);
  }

  return {
    device_ids: deviceIds,
    location_ids: locationIds,
    include_child_locations: true,
  };
}

/** The devices and locations a widget's own sources select. */
export function sourcesScope(sources: WidgetSource[]): AnalyticsScope {
  const deviceIds: string[] = [];

  const locationIds: string[] = [];

  for (const source of sources) {
    if (source.device_id) {
      deviceIds.push(source.device_id);
    }
    if (source.location_id) {
      locationIds.push(source.location_id);
    }
  }

  return {
    device_ids: deviceIds,
    location_ids: locationIds,
    include_child_locations: sources.every((source) => source.include_child_locations !== false),
  };
}

/** A widget with its own sources ignores the dashboard scope and filters. */
export function widgetScope(
  sources: WidgetSource[],
  dashboard: DashboardOwner,
  filters: DashboardFilters,
): AnalyticsScope {
  if (sources.length > 0) {
    return sourcesScope(sources);
  }

  return dashboardScope(dashboard, filters);
}

/** A widget's own time range, or the dashboard's when it doesn't set one. */
function widgetTime(widget: WidgetConfig, filters: DashboardFilters) {
  if (widget.time_range == null) {
    return {
      time_range: filters.timeRange,
      time_from: filters.timeFrom,
      time_to: filters.timeTo,
    };
  }

  return {
    time_range: widget.time_range,
    time_from: widget.time_from ?? null,
    time_to: widget.time_to ?? null,
  };
}

/** Summary widgets show one value per device; the rest draw a series over time. */
function queryMode(widget: WidgetConfig): AnalyticsQuery['mode'] {
  if (widget.type === 'kpi' || widget.type === 'gauge' || widget.type === 'map') {
    return 'summary';
  }
  if (widget.type === 'table' && widget.aggregation === 'latest') {
    return 'summary';
  }

  return 'series';
}

/** Only maps read position parameters. */
function positionMetrics(widget: WidgetConfig) {
  if (widget.type !== 'map') {
    return { latitude_metric: null, longitude_metric: null };
  }

  return {
    latitude_metric: widget.latitude_metric,
    longitude_metric: widget.longitude_metric,
  };
}

/**
 * Turns a widget into an analytics query. Widgets inherit the dashboard scope, filters and
 * time range unless they set their own, so changing a dashboard filter updates every
 * widget that hasn't overridden it.
 */
export function buildWidgetQuery(
  id: string,
  widget: WidgetConfig,
  dashboard: DashboardOwner,
  filters: DashboardFilters,
): AnalyticsQuery {
  return {
    id,
    scope: widgetScope(widget.sources ?? [], dashboard, filters),
    metric_key: widget.metric_key,
    aggregation: widget.aggregation,
    mode: queryMode(widget),
    bucket_size: widget.bucket_size ?? 'auto',
    split_by_device: widget.type === 'gauge' ? false : (widget.split_by_device ?? true),
    compare_previous: widget.type === 'kpi' && widget.aggregation !== 'latest',
    ...positionMetrics(widget),
    ...widgetTime(widget, filters),
  };
}

export function widgetToInput(widget: Widget): WidgetInput {
  return {
    title: widget.title,
    type: widget.type,
    metric_key: widget.metric_key,
    aggregation: widget.aggregation,
    bucket_size: widget.bucket_size,
    split_by_device: widget.split_by_device,
    time_range: widget.time_range,
    time_from: widget.time_from?.toISOString() ?? null,
    time_to: widget.time_to?.toISOString() ?? null,
    latitude_metric: widget.latitude_metric,
    longitude_metric: widget.longitude_metric,
    sources: widget.sources,
    decimals: widget.decimals,
    show_unit: widget.show_unit,
    show_legend: widget.show_legend,
    color: widget.color,
    min_value: widget.min_value,
    max_value: widget.max_value,
    true_label: widget.true_label,
    false_label: widget.false_label,
    thresholds: widget.thresholds,
    width: widget.width,
    height: widget.height,
  };
}
