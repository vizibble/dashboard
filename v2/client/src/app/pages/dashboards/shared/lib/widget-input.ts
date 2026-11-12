import {
  aggregationsByDataType,
  aggregationsByWidget,
  dataTypesByWidget,
  type Aggregation,
} from '@vizibble/shared/dashboards';

import type { DiscoveredMetric, WidgetInput, WidgetType } from '@/app/pages/dashboards/shared/types';
import type { WidgetPresentation } from '@/app/pages/dashboards/shared/widgets/types';

/** Where a widget's devices come from in the editor. */
export type SourceMode = 'dashboard' | 'devices' | 'location';

export const SOURCE_MODES: readonly SourceMode[] = ['dashboard', 'devices', 'location'];

const DEFAULT_SIZE: Record<WidgetType, { width: number; height: number }> = {
  kpi: { width: 3, height: 1 },
  gauge: { width: 3, height: 2 },
  line: { width: 6, height: 2 },
  area: { width: 6, height: 2 },
  bar: { width: 6, height: 2 },
  state: { width: 6, height: 2 },
  table: { width: 6, height: 2 },
  map: { width: 6, height: 3 },
};

const TIME_SERIES_TYPES: readonly WidgetType[] = ['line', 'area', 'bar'];

const SPLITTABLE_TYPES: readonly WidgetType[] = ['kpi', 'line', 'area', 'bar'];

export function isTimeSeries(type: WidgetType) {
  return TIME_SERIES_TYPES.includes(type);
}

/** Widgets that can show one value or line per device. */
export function canSplitByDevice(type: WidgetType) {
  return SPLITTABLE_TYPES.includes(type);
}

/** Widgets with a numeric axis or dial range. */
export function hasValueRange(type: WidgetType) {
  return type !== 'kpi' && type !== 'table' && type !== 'map';
}

export function isNumericMetric(metric: Pick<DiscoveredMetric, 'data_type'> | undefined) {
  return metric?.data_type === 'number' || metric?.data_type === 'integer';
}

/** The first calculation a visualisation offers. Every widget type has at least one. */
function defaultAggregation(type: WidgetType): Aggregation {
  return aggregationsByWidget[type][0] ?? 'latest';
}

export function emptyWidgetInput(type: WidgetType): WidgetInput {
  return {
    title: '',
    type,
    metric_key: '',
    aggregation: defaultAggregation(type),
    bucket_size: 'auto',
    split_by_device: true,
    time_range: null,
    time_from: null,
    time_to: null,
    latitude_metric: null,
    longitude_metric: null,
    sources: [],
    decimals: null,
    show_unit: true,
    show_legend: true,
    color: null,
    min_value: null,
    max_value: null,
    true_label: null,
    false_label: null,
    thresholds: [],
    width: DEFAULT_SIZE[type].width,
    height: DEFAULT_SIZE[type].height,
  };
}

export function initialSourceMode(input: WidgetInput): SourceMode {
  if (input.sources?.some((source) => source.location_id)) {
    return 'location';
  }
  if (input.sources?.length) {
    return 'devices';
  }

  return 'dashboard';
}

/** Calculations the visualisation offers, narrowed to what the chosen parameter supports. */
export function aggregationOptions(type: WidgetType, metric: DiscoveredMetric | undefined) {
  return aggregationsByWidget[type].filter(
    (aggregation) => !metric || aggregationsByDataType[metric.data_type].includes(aggregation),
  );
}

export function compatibleMetrics(metrics: DiscoveredMetric[], type: WidgetType) {
  return metrics.filter((metric) => dataTypesByWidget[type].includes(metric.data_type));
}

/** A numeric parameter whose key looks like a latitude or longitude. */
function guessPositionKey(numericMetrics: DiscoveredMetric[], prefix: 'lat' | 'lon') {
  return numericMetrics.find((item) => item.key.toLowerCase().startsWith(prefix))?.key ?? null;
}

/**
 * Switches visualisation. Keeps the query when the new visualisation can still draw it,
 * and resets the size for widgets that haven't been placed yet.
 */
export function withWidgetType(
  current: WidgetInput,
  type: WidgetType,
  metrics: DiscoveredMetric[],
  resetSize: boolean,
): WidgetInput {
  const stillCompatible = metrics.some(
    (item) => item.key === current.metric_key && dataTypesByWidget[type].includes(item.data_type),
  );

  const next: WidgetInput = {
    ...current,
    type,
    metric_key: stillCompatible ? current.metric_key : '',
    aggregation: aggregationsByWidget[type].includes(current.aggregation)
      ? current.aggregation
      : defaultAggregation(type),
    latitude_metric: null,
    longitude_metric: null,
  };

  if (type === 'map') {
    const numericMetrics = metrics.filter(isNumericMetric);

    next.latitude_metric = current.latitude_metric ?? guessPositionKey(numericMetrics, 'lat');
    next.longitude_metric = current.longitude_metric ?? guessPositionKey(numericMetrics, 'lon');
  }
  if (resetSize) {
    next.width = DEFAULT_SIZE[type].width;
    next.height = DEFAULT_SIZE[type].height;
  }

  return next;
}

/** Keeps the calculation when the parameter supports it, otherwise the first one that fits. */
function aggregationFor(current: WidgetInput, metric: DiscoveredMetric | undefined): Aggregation {
  const allowed = metric ? aggregationsByDataType[metric.data_type] : [];

  if (allowed.includes(current.aggregation)) {
    return current.aggregation;
  }

  return aggregationsByWidget[current.type].find((item) => allowed.includes(item)) ?? current.aggregation;
}

/** Chooses a parameter, and names the widget after it when it has no title yet. */
export function withMetric(
  current: WidgetInput,
  key: string,
  metric: DiscoveredMetric | undefined,
): WidgetInput {
  return {
    ...current,
    metric_key: key,
    aggregation: aggregationFor(current, metric),
    title: current.title || metric?.label || '',
  };
}

/** The first problem with the widget's data settings, or null. */
export function validateWidgetData(
  values: WidgetInput,
  options: { aggregations: readonly Aggregation[]; sourceMode: SourceMode },
): string | null {
  if (!values.metric_key) {
    return 'Choose a parameter.';
  }
  if (!options.aggregations.includes(values.aggregation)) {
    return 'Choose a calculation.';
  }
  if (values.type === 'map' && (!values.latitude_metric || !values.longitude_metric)) {
    return 'Choose the latitude and longitude parameters.';
  }
  if (options.sourceMode !== 'dashboard' && !values.sources?.length) {
    return 'Choose at least one device or location.';
  }
  if (values.time_range === 'custom' && (!values.time_from || !values.time_to)) {
    return 'Set the custom time range.';
  }

  return null;
}

/** A map needs both position parameters before it can be previewed. */
export function canPreview(values: WidgetInput) {
  if (!values.metric_key) {
    return false;
  }
  if (values.type !== 'map') {
    return true;
  }

  return Boolean(values.latitude_metric && values.longitude_metric);
}

/** The unsaved input as the presentation settings a visualisation reads. */
export function toPresentation(values: WidgetInput): WidgetPresentation {
  return {
    title: values.title || 'Preview',
    type: values.type,
    aggregation: values.aggregation,
    decimals: values.decimals ?? null,
    show_unit: values.show_unit ?? true,
    show_legend: values.show_legend ?? true,
    color: values.color ?? null,
    min_value: values.min_value ?? null,
    max_value: values.max_value ?? null,
    true_label: values.true_label ?? null,
    false_label: values.false_label ?? null,
    thresholds: (values.thresholds ?? []).map((threshold) => ({
      ...threshold,
      label: threshold.label ?? null,
    })),
  };
}
