import type { MetricInfo, Widget, WidgetThreshold } from '@/app/pages/dashboards/shared/types';

type Presentation = Pick<Widget, 'decimals' | 'show_unit' | 'true_label' | 'false_label' | 'aggregation'>;

/** Formats a reading for display. Missing values render as an em dash, never as 0. */
export function formatValue(
  value: number | string | boolean | null | undefined,
  metric: MetricInfo | null,
  presentation: Presentation,
  options: { withUnit?: boolean } = {},
) {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? presentation.true_label || 'On' : presentation.false_label || 'Off';
  }
  if (typeof value === 'string') {
    return value;
  }

  const isCount = presentation.aggregation === 'count';

  const decimals = isCount ? 0 : (presentation.decimals ?? (metric?.data_type === 'integer' ? 0 : 2));

  const text = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);

  const symbol = !isCount && presentation.show_unit && options.withUnit !== false ? metric?.symbol : null;

  return symbol ? `${text} ${symbol}` : text;
}

export function formatTimestamp(value: Date, timezone: string | undefined, withDate = true) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  };

  if (withDate) {
    options.day = 'numeric';
    options.month = 'short';
  }

  return new Intl.DateTimeFormat(undefined, options).format(value);
}

export function formatRelative(value: Date | null) {
  if (!value) {
    return 'Never';
  }
  const seconds = Math.round((Date.now() - value.getTime()) / 1000);

  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(seconds) < 60) {
    return format.format(-seconds, 'second');
  }
  if (Math.abs(seconds) < 3600) {
    return format.format(-Math.round(seconds / 60), 'minute');
  }
  if (Math.abs(seconds) < 86_400) {
    return format.format(-Math.round(seconds / 3600), 'hour');
  }

  return format.format(-Math.round(seconds / 86_400), 'day');
}

/** Threshold colour for a value: the highest band the value has reached. */
export function thresholdColor(value: number | null, thresholds: WidgetThreshold[]) {
  if (value === null) {
    return null;
  }
  let color: string | null = null;

  for (const threshold of [...thresholds].sort((a, b) => a.value - b.value)) {
    if (value >= threshold.value) {
      color = threshold.color;
    }
  }

  return color;
}

/** An ISO instant as the value of a `datetime-local` input, in the browser's timezone. */
export function toLocalInputValue(value: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
