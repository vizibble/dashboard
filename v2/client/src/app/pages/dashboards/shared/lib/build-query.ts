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

/** The dashboard's own scope, narrowed by the location/device filter when one is chosen. */
export function dashboardScope(
  dashboard: Pick<DashboardDetail, 'device_id' | 'location_id'>,
  filters: DashboardFilters,
) {
  if (filters.deviceId) return { device_ids: [filters.deviceId], location_ids: [], include_child_locations: true };
  if (filters.locationId) return { device_ids: [], location_ids: [filters.locationId], include_child_locations: true };
  return {
    device_ids: dashboard.device_id ? [dashboard.device_id] : [],
    location_ids: dashboard.location_id ? [dashboard.location_id] : [],
    include_child_locations: true,
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
  dashboard: Pick<DashboardDetail, 'device_id' | 'location_id'>,
  filters: DashboardFilters,
): AnalyticsQuery {
  const sources = widget.sources ?? [];
  const scope =
    sources.length > 0
      ? {
          device_ids: sources.flatMap((source) => (source.device_id ? [source.device_id] : [])),
          location_ids: sources.flatMap((source) => (source.location_id ? [source.location_id] : [])),
          include_child_locations: sources.every((source) => source.include_child_locations !== false),
        }
      : dashboardScope(dashboard, filters);

  const ownRange = widget.time_range ?? null;
  const time =
    ownRange === null
      ? { time_range: filters.timeRange, time_from: filters.timeFrom, time_to: filters.timeTo }
      : { time_range: ownRange, time_from: widget.time_from ?? null, time_to: widget.time_to ?? null };

  const summary = widget.type === 'kpi' || widget.type === 'gauge' || widget.type === 'map';
  const latestTable = widget.type === 'table' && widget.aggregation === 'latest';

  return {
    id,
    scope,
    metric_key: widget.metric_key,
    aggregation: widget.aggregation,
    mode: summary || latestTable ? 'summary' : 'series',
    bucket_size: widget.bucket_size ?? 'auto',
    split_by_device: widget.type === 'gauge' ? false : (widget.split_by_device ?? true),
    compare_previous: widget.type === 'kpi' && widget.aggregation !== 'latest',
    latitude_metric: widget.type === 'map' ? widget.latitude_metric : null,
    longitude_metric: widget.type === 'map' ? widget.longitude_metric : null,
    ...time,
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
