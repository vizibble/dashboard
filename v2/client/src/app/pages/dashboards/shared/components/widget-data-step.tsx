import { bucketSizes, timeRanges } from '@vizibble/shared/dashboards';

import { CheckboxField } from '@/app/pages/dashboards/shared/components/checkbox-field';
import { DateTimeField } from '@/app/pages/dashboards/shared/components/date-time-field';
import { WidgetSourceFields } from '@/app/pages/dashboards/shared/components/widget-source-fields';
import type { WidgetEditor } from '@/app/pages/dashboards/shared/hooks/use-widget-editor';
import { isOneOf } from '@/app/pages/dashboards/shared/lib/is-one-of';
import {
  AGGREGATION_LABELS,
  BUCKET_SIZE_LABELS,
  TIME_RANGE_LABELS,
  WIDGET_TYPE_LABELS,
} from '@/app/pages/dashboards/shared/lib/labels';
import {
  canSplitByDevice,
  compatibleMetrics,
  isNumericMetric,
  isTimeSeries,
} from '@/app/pages/dashboards/shared/lib/widget-input';
import type { DashboardDetail, DiscoveredMetric, WidgetType } from '@/app/pages/dashboards/shared/types';
import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';

const INHERIT = 'inherit';

const POSITION_FIELDS = [
  { key: 'latitude_metric', label: 'Latitude parameter' },
  { key: 'longitude_metric', label: 'Longitude parameter' },
] as const;

type WidgetDataStepProps = {
  dashboard: DashboardDetail;
  editor: WidgetEditor;
};

/** Step 2: which devices, which parameter, and how to calculate it over what time. */
export function WidgetDataStep({ dashboard, editor }: WidgetDataStepProps) {
  const { values, set, metrics, isMetricsPending, aggregations, chooseMetric } = editor;

  const options = compatibleMetrics(metrics, values.type);

  const numericMetrics = metrics.filter(isNumericMetric);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <WidgetSourceFields dashboard={dashboard} editor={editor} />

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="widget-metric">Parameter</FieldLabel>
        <Select value={values.metric_key} onValueChange={chooseMetric} disabled={isMetricsPending}>
          <SelectTrigger id="widget-metric" className="w-full">
            <SelectValue placeholder={isMetricsPending ? 'Loading parameters…' : 'Select a parameter'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((item) => (
              <SelectItem key={item.key} value={item.key}>
                {item.label}
                {item.symbol ? ` (${item.symbol})` : ''}
                <span className="text-muted-foreground ml-1 text-xs">
                  · {item.device_count} device{item.device_count === 1 ? '' : 's'}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isMetricsPending && options.length === 0 && (
          <NoMetricsMessage hasMetrics={metrics.length > 0} type={values.type} />
        )}
      </Field>

      {values.type === 'map' &&
        POSITION_FIELDS.map(({ key, label }) => (
          <Field key={key}>
            <FieldLabel htmlFor={`widget-${key}`}>{label}</FieldLabel>
            <Select value={values[key] ?? ''} onValueChange={(value) => set(key, value)}>
              <SelectTrigger id={`widget-${key}`} className="w-full">
                <SelectValue placeholder="Select a parameter" />
              </SelectTrigger>
              <MetricOptions metrics={numericMetrics} />
            </Select>
          </Field>
        ))}

      <Field>
        <FieldLabel htmlFor="widget-aggregation">Calculation</FieldLabel>
        <Select
          value={values.aggregation}
          onValueChange={(value) => isOneOf(aggregations, value) && set('aggregation', value)}
        >
          <SelectTrigger id="widget-aggregation" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aggregations.map((aggregation) => (
              <SelectItem key={aggregation} value={aggregation}>
                {AGGREGATION_LABELS[aggregation]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="widget-range">Time range</FieldLabel>
        <Select
          value={values.time_range ?? INHERIT}
          onValueChange={(value) => set('time_range', isOneOf(timeRanges, value) ? value : null)}
        >
          <SelectTrigger id="widget-range" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={INHERIT}>Same as dashboard</SelectItem>
            {timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {TIME_RANGE_LABELS[range]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {values.time_range === 'custom' && (
        <>
          <DateTimeField
            id="widget-from"
            label="From"
            value={values.time_from ?? null}
            onChange={(value) => set('time_from', value)}
          />
          <DateTimeField
            id="widget-to"
            label="To"
            value={values.time_to ?? null}
            onChange={(value) => set('time_to', value)}
          />
        </>
      )}

      {isTimeSeries(values.type) && values.aggregation !== 'raw' && (
        <Field>
          <FieldLabel htmlFor="widget-interval">Interval</FieldLabel>
          <Select
            value={values.bucket_size ?? 'auto'}
            onValueChange={(value) => isOneOf(bucketSizes, value) && set('bucket_size', value)}
          >
            <SelectTrigger id="widget-interval" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bucketSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {BUCKET_SIZE_LABELS[size]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {canSplitByDevice(values.type) && (
        <CheckboxField
          id="widget-split"
          className="self-end pb-2"
          checked={values.split_by_device ?? true}
          onCheckedChange={(checked) => set('split_by_device', checked)}
        >
          {values.type === 'kpi' ? 'One value per device' : 'One line per device'}
        </CheckboxField>
      )}
    </div>
  );
}

function MetricOptions({ metrics }: { metrics: DiscoveredMetric[] }) {
  return (
    <SelectContent>
      {metrics.map((item) => (
        <SelectItem key={item.key} value={item.key}>
          {item.label}
        </SelectItem>
      ))}
    </SelectContent>
  );
}

function NoMetricsMessage({ hasMetrics, type }: { hasMetrics: boolean; type: WidgetType }) {
  return (
    <p className="text-muted-foreground text-xs">
      {hasMetrics
        ? `None of these devices record a parameter a ${WIDGET_TYPE_LABELS[type].label.toLowerCase()} can show.`
        : 'No devices in this selection have parameters yet.'}
    </p>
  );
}
