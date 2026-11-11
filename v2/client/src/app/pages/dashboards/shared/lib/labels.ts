import type { Aggregation, BucketSize, TimeRange, WidgetType } from '@/app/pages/dashboards/shared/types';

export const WIDGET_TYPE_LABELS: Record<WidgetType, { label: string; description: string }> = {
  kpi: { label: 'Value', description: 'One number with change from the previous period' },
  line: { label: 'Line chart', description: 'Trend over time' },
  area: { label: 'Area chart', description: 'Trend over time, filled' },
  bar: { label: 'Bar chart', description: 'Totals or averages per interval' },
  gauge: { label: 'Gauge', description: 'Current level against a range' },
  state: { label: 'State timeline', description: 'On/off or status changes over time' },
  table: { label: 'Table', description: 'Readings as rows' },
  map: { label: 'Map', description: 'Device positions from GPS readings' },
};

export const AGGREGATION_LABELS: Record<Aggregation, string> = {
  latest: 'Latest reading',
  raw: 'Every reading',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
  sum: 'Total',
  count: 'Number of readings',
};

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1h': 'Last hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  custom: 'Custom range',
};

export const BUCKET_SIZE_LABELS: Record<BucketSize, string> = {
  auto: 'Automatic',
  '1m': 'Every minute',
  '5m': 'Every 5 minutes',
  '15m': 'Every 15 minutes',
  '1h': 'Hourly',
  '6h': 'Every 6 hours',
  '1d': 'Daily',
  '1w': 'Weekly',
};

export const REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 15, label: 'Every 15 seconds' },
  { value: 30, label: 'Every 30 seconds' },
  { value: 60, label: 'Every minute' },
  { value: 300, label: 'Every 5 minutes' },
] as const;

export const MISSING_REASON_LABELS = {
  metric_not_in_template: "doesn't record this parameter",
  incompatible_type: 'records this parameter as a different kind of value',
  no_data: 'sent no readings in this period',
} as const;

export const WIDTH_OPTIONS = [
  { value: 3, label: 'Small' },
  { value: 4, label: 'Medium' },
  { value: 6, label: 'Half' },
  { value: 8, label: 'Wide' },
  { value: 12, label: 'Full' },
] as const;
