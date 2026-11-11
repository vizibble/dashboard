import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import {
  aggregationsByDataType,
  aggregationsByWidget,
  bucketSizes,
  dataTypesByWidget,
  timeRanges,
  widgetTypes,
} from '@vizibble/shared/dashboards';
import { useMemo, useState, type FormEvent } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { CheckboxField } from '@/app/pages/dashboards/shared/components/checkbox-field';
import { WidgetBody } from '@/app/pages/dashboards/shared/components/widget-card';
import {
  useDashboardData,
  useDiscoverMetrics,
  useSaveWidget,
} from '@/app/pages/dashboards/shared/hooks/use-dashboards-api';
import { buildWidgetQuery, dashboardScope, widgetToInput } from '@/app/pages/dashboards/shared/lib/build-query';
import {
  AGGREGATION_LABELS,
  BUCKET_SIZE_LABELS,
  TIME_RANGE_LABELS,
  WIDGET_TYPE_LABELS,
} from '@/app/pages/dashboards/shared/lib/labels';
import type {
  DashboardDetail,
  DashboardFilters,
  Widget,
  WidgetInput,
  WidgetType,
} from '@/app/pages/dashboards/shared/types';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-devices-api';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';
import { getLocationPath } from '@/app/pages/locations/shared/lib/get-location-path';
import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/ui/select';
import { toast } from '@/app/shared/hooks/use-toast';
import { cn } from '@/app/shared/utils/cn';

const STEPS = ['Visualisation', 'Data', 'Display'] as const;
const INHERIT = 'inherit';
type SourceMode = 'dashboard' | 'devices' | 'location';

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

function emptyInput(type: WidgetType): WidgetInput {
  return {
    title: '',
    type,
    metric_key: '',
    aggregation: aggregationsByWidget[type][0]!,
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
    ...DEFAULT_SIZE[type],
  };
}

type WidgetEditorDialogProps = {
  dashboard: DashboardDetail;
  filters: DashboardFilters;
  /** null = closed, 'new' = add, otherwise the widget to edit. */
  target: Widget | 'new' | null;
  onClose: () => void;
};

export function WidgetEditorDialog({ dashboard, filters, target, onClose }: WidgetEditorDialogProps) {
  const editing = target !== null && target !== 'new' ? target : null;
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        {target !== null && (
          <WidgetEditorForm
            key={editing?.id ?? 'new'}
            dashboard={dashboard}
            filters={filters}
            editing={editing}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialSourceMode(input: WidgetInput): SourceMode {
  if (input.sources?.some((source) => source.location_id)) return 'location';
  return input.sources?.length ? 'devices' : 'dashboard';
}

/** Remounted per widget, so its state always starts from the widget being edited. */
function WidgetEditorForm({
  dashboard,
  filters,
  editing,
  onClose,
}: Omit<WidgetEditorDialogProps, 'target'> & { editing: Widget | null }) {
  const { organisation } = useOrganisationContext();
  const { devices } = useFetchDevices(organisation.id);
  const { locations } = useFetchLocations(organisation.id);
  const { mutateAsync: save, isSaving } = useSaveWidget(organisation.id, dashboard.id);

  const [values, setValues] = useState<WidgetInput>(() => (editing ? widgetToInput(editing) : emptyInput('line')));
  const [step, setStep] = useState(editing ? 1 : 0);
  const [sourceMode, setSourceMode] = useState<SourceMode>(() => initialSourceMode(values));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WidgetInput>(key: K, value: WidgetInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const scopeDevices = useMemo(() => {
    if (dashboard.device_id) return devices.filter((device) => device.id === dashboard.device_id);
    return devices;
  }, [dashboard.device_id, devices]);

  const locationOptions = useMemo(() => {
    const byId = new Map(locations.map((location) => [location.id, location]));
    return locations
      .map((location) => ({
        id: location.id,
        label: getLocationPath(location, byId)
          .map((item) => item.name)
          .join(' / '),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations]);

  const sources = useMemo(() => values.sources ?? [], [values.sources]);
  const scope = useMemo(
    () =>
      sources.length > 0
        ? {
            device_ids: sources.flatMap((source) => (source.device_id ? [source.device_id] : [])),
            location_ids: sources.flatMap((source) => (source.location_id ? [source.location_id] : [])),
            include_child_locations: true,
          }
        : dashboardScope(dashboard, filters),
    [dashboard, filters, sources],
  );
  const { metrics, isPending: isMetricsPending } = useDiscoverMetrics(organisation.id, scope);

  const compatibleMetrics = metrics.filter((metric) => dataTypesByWidget[values.type].includes(metric.data_type));
  const metric = metrics.find((item) => item.key === values.metric_key);
  const aggregationOptions = aggregationsByWidget[values.type].filter(
    (aggregation) => !metric || aggregationsByDataType[metric.data_type].includes(aggregation),
  );
  const numericMetrics = metrics.filter((item) => item.data_type === 'number' || item.data_type === 'integer');
  const isTimeSeries = ['line', 'area', 'bar'].includes(values.type);
  const isBoolean = metric?.data_type === 'boolean';
  const isNumeric = metric?.data_type === 'number' || metric?.data_type === 'integer';

  const chooseType = (type: WidgetType) => {
    setValues((current) => {
      const stillCompatible = metrics.find(
        (item) => item.key === current.metric_key && dataTypesByWidget[type].includes(item.data_type),
      );
      const aggregation = aggregationsByWidget[type].includes(current.aggregation)
        ? current.aggregation
        : aggregationsByWidget[type][0]!;
      return {
        ...current,
        type,
        // Keep the query when the new visualisation can still draw it.
        metric_key: stillCompatible ? current.metric_key : '',
        aggregation,
        latitude_metric: type === 'map' ? (current.latitude_metric ?? guessKey('lat')) : null,
        longitude_metric: type === 'map' ? (current.longitude_metric ?? guessKey('lon')) : null,
        ...(editing ? {} : DEFAULT_SIZE[type]),
      };
    });
  };

  function guessKey(prefix: 'lat' | 'lon') {
    return numericMetrics.find((item) => item.key.toLowerCase().startsWith(prefix))?.key ?? null;
  }

  const chooseMetric = (key: string) => {
    const next = metrics.find((item) => item.key === key);
    setValues((current) => {
      const allowed = next ? aggregationsByDataType[next.data_type] : [];
      const aggregation = allowed.includes(current.aggregation)
        ? current.aggregation
        : (aggregationsByWidget[current.type].find((item) => allowed.includes(item)) ?? current.aggregation);
      return {
        ...current,
        metric_key: key,
        aggregation,
        title: current.title || next?.label || '',
      };
    });
  };

  const previewQuery = useMemo(
    () =>
      values.metric_key && (values.type !== 'map' || (values.latitude_metric && values.longitude_metric))
        ? [buildWidgetQuery('preview', values, dashboard, filters)]
        : [],
    [dashboard, filters, values],
  );
  const preview = useDashboardData(organisation.id, previewQuery, 0);

  const validate = () => {
    if (!values.metric_key) return 'Choose a parameter.';
    if (!aggregationOptions.includes(values.aggregation)) return 'Choose a calculation.';
    if (values.type === 'map' && (!values.latitude_metric || !values.longitude_metric))
      return 'Choose the latitude and longitude parameters.';
    if (sourceMode !== 'dashboard' && sources.length === 0) return 'Choose at least one device or location.';
    if (values.time_range === 'custom' && (!values.time_from || !values.time_to)) return 'Set the custom time range.';
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      const problem = step === 1 ? validate() : null;
      if (problem) return setError(problem);
      setError(null);
      return setStep(step + 1);
    }
    const problem = validate() ?? (values.title.trim() ? null : 'Give the widget a title.');
    if (problem) return setError(problem);
    try {
      await save({
        widgetId: editing?.id,
        values: { ...values, title: values.title.trim(), sources: sourceMode === 'dashboard' ? [] : sources },
      });
      toast({ variant: 'success', title: editing ? 'Widget updated' : 'Widget added' });
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to save widget.');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit widget' : 'Add widget'}</DialogTitle>
        <DialogDescription>
          <ol className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {STEPS.map((label, index) => (
              <li key={label} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">›</span>}
                <button
                  type="button"
                  onClick={() => (index <= step || values.metric_key ? setStep(index) : undefined)}
                  className={cn(
                    'rounded-sm',
                    index === step ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={index === step ? 'step' : undefined}
                >
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        {step === 0 && (
          <fieldset>
            <legend className="sr-only">Visualisation</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {widgetTypes.map((type) => (
                <label
                  key={type}
                  className={cn(
                    'hover:bg-muted/60 has-focus-visible:ring-ring cursor-pointer rounded-md border p-3 has-focus-visible:ring-2',
                    values.type === type && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="radio"
                    name="widget-type"
                    value={type}
                    checked={values.type === type}
                    onChange={() => chooseType(type)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">{WIDGET_TYPE_LABELS[type].label}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {WIDGET_TYPE_LABELS[type].description}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.scope !== 'device' && (
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="widget-source">Devices</FieldLabel>
                <Select
                  value={sourceMode}
                  onValueChange={(value) => {
                    setSourceMode(value as SourceMode);
                    set('sources', []);
                  }}
                >
                  <SelectTrigger id="widget-source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">
                      {dashboard.scope === 'location' ? 'All devices at this location' : 'All devices'} (follows
                      dashboard filters)
                    </SelectItem>
                    <SelectItem value="devices">Choose devices</SelectItem>
                    <SelectItem value="location">Choose a location</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {sourceMode === 'devices' && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-sm font-medium">Select devices</legend>
                <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                  {scopeDevices.map((device) => {
                    const checked = sources.some((source) => source.device_id === device.id);
                    return (
                      <CheckboxField
                        key={device.id}
                        id={`widget-device-${device.id}`}
                        checked={checked}
                        onCheckedChange={() =>
                          set(
                            'sources',
                            checked
                              ? sources.filter((source) => source.device_id !== device.id)
                              : [...sources, { device_id: device.id }],
                          )
                        }
                      >
                        {device.name}
                      </CheckboxField>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {sourceMode === 'location' && (
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="widget-location">Location (includes everything inside it)</FieldLabel>
                <Select
                  value={sources[0]?.location_id ?? ''}
                  onValueChange={(value) => set('sources', [{ location_id: value, include_child_locations: true }])}
                >
                  <SelectTrigger id="widget-location" className="w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="widget-metric">Parameter</FieldLabel>
              <Select value={values.metric_key} onValueChange={chooseMetric} disabled={isMetricsPending}>
                <SelectTrigger id="widget-metric" className="w-full">
                  <SelectValue placeholder={isMetricsPending ? 'Loading parameters…' : 'Select a parameter'} />
                </SelectTrigger>
                <SelectContent>
                  {compatibleMetrics.map((item) => (
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
              {!isMetricsPending && compatibleMetrics.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {metrics.length === 0
                    ? 'No devices in this selection have parameters yet.'
                    : `None of these devices record a parameter a ${WIDGET_TYPE_LABELS[values.type].label.toLowerCase()} can show.`}
                </p>
              )}
            </Field>

            {values.type === 'map' && (
              <>
                {(['latitude_metric', 'longitude_metric'] as const).map((key) => (
                  <Field key={key}>
                    <FieldLabel htmlFor={`widget-${key}`}>
                      {key === 'latitude_metric' ? 'Latitude parameter' : 'Longitude parameter'}
                    </FieldLabel>
                    <Select value={values[key] ?? ''} onValueChange={(value) => set(key, value)}>
                      <SelectTrigger id={`widget-${key}`} className="w-full">
                        <SelectValue placeholder="Select a parameter" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericMetrics.map((item) => (
                          <SelectItem key={item.key} value={item.key}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}
              </>
            )}

            <Field>
              <FieldLabel htmlFor="widget-aggregation">Calculation</FieldLabel>
              <Select
                value={values.aggregation}
                onValueChange={(value) => set('aggregation', value as WidgetInput['aggregation'])}
              >
                <SelectTrigger id="widget-aggregation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aggregationOptions.map((aggregation) => (
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
                onValueChange={(value) =>
                  set('time_range', value === INHERIT ? null : (value as WidgetInput['time_range']))
                }
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

            {isTimeSeries && values.aggregation !== 'raw' && (
              <Field>
                <FieldLabel htmlFor="widget-interval">Interval</FieldLabel>
                <Select
                  value={values.bucket_size ?? 'auto'}
                  onValueChange={(value) => set('bucket_size', value as WidgetInput['bucket_size'])}
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

            {['kpi', 'line', 'area', 'bar'].includes(values.type) && (
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
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="widget-title" required>
                Title
              </FieldLabel>
              <Input
                id="widget-title"
                value={values.title}
                maxLength={160}
                onChange={(event) => {
                  set('title', event.target.value);
                  if (event.target.value.trim()) setError(null);
                }}
                aria-invalid={Boolean(error && !values.title.trim())}
              />
            </Field>
            {isNumeric && (
              <>
                <Field>
                  <FieldLabel htmlFor="widget-decimals">Decimal places</FieldLabel>
                  <Select
                    value={values.decimals == null ? INHERIT : String(values.decimals)}
                    onValueChange={(value) => set('decimals', value === INHERIT ? null : Number(value))}
                  >
                    <SelectTrigger id="widget-decimals" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={INHERIT}>Automatic</SelectItem>
                      {[0, 1, 2, 3, 4].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="widget-color">Colour</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      id="widget-color"
                      type="color"
                      value={values.color ?? '#3fafd5'}
                      onChange={(event) => set('color', event.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                    />
                    {values.color && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => set('color', null)}>
                        Use theme colour
                      </Button>
                    )}
                  </div>
                </Field>
                {values.type !== 'kpi' && values.type !== 'table' && values.type !== 'map' && (
                  <>
                    <NumberField
                      id="widget-min"
                      label={values.type === 'gauge' ? 'Gauge minimum' : 'Axis minimum'}
                      value={values.min_value ?? null}
                      onChange={(value) => set('min_value', value)}
                    />
                    <NumberField
                      id="widget-max"
                      label={values.type === 'gauge' ? 'Gauge maximum' : 'Axis maximum'}
                      value={values.max_value ?? null}
                      onChange={(value) => set('max_value', value)}
                    />
                  </>
                )}
                <ThresholdsEditor
                  thresholds={values.thresholds ?? []}
                  onChange={(thresholds) => set('thresholds', thresholds)}
                />
              </>
            )}
            {isBoolean && (
              <>
                <Field>
                  <FieldLabel htmlFor="widget-true">Label when on</FieldLabel>
                  <Input
                    id="widget-true"
                    placeholder="On"
                    value={values.true_label ?? ''}
                    maxLength={40}
                    onChange={(event) => set('true_label', event.target.value || null)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="widget-false">Label when off</FieldLabel>
                  <Input
                    id="widget-false"
                    placeholder="Off"
                    value={values.false_label ?? ''}
                    maxLength={40}
                    onChange={(event) => set('false_label', event.target.value || null)}
                  />
                </Field>
              </>
            )}
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              {metric?.symbol && (
                <CheckboxField
                  id="widget-show-unit"
                  className="w-auto"
                  checked={values.show_unit ?? true}
                  onCheckedChange={(checked) => set('show_unit', checked)}
                >
                  Show unit ({metric.symbol})
                </CheckboxField>
              )}
              {(isTimeSeries || values.type === 'state') && (
                <CheckboxField
                  id="widget-show-legend"
                  className="w-auto"
                  checked={values.show_legend ?? true}
                  onCheckedChange={(checked) => set('show_legend', checked)}
                >
                  Show legend
                </CheckboxField>
              )}
            </div>
          </div>
        )}

        {step > 0 && (
          <section aria-label="Preview" className="bg-muted/30 rounded-lg border">
            <p className="text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">Preview with live data</p>
            <div className="h-56 px-4 py-3">
              {previewQuery.length === 0 ? (
                <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Choose a parameter to see a preview.
                </p>
              ) : (
                <WidgetBody
                  presentation={{
                    ...values,
                    title: values.title || 'Preview',
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
                  }}
                  result={preview.results[0]}
                  isLoading={preview.isFetching}
                  isError={preview.isError}
                />
              )}
            </div>
          </section>
        )}

        {error && <FieldError>{error}</FieldError>}

        <DialogFooter>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isSaving}>
              Back
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSaving}
            loadingText={step < STEPS.length - 1 ? 'Next…' : editing ? 'Saving…' : 'Adding…'}
          >
            {step < STEPS.length - 1 ? 'Next' : editing ? 'Save widget' : 'Add widget'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder="Automatic"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    </Field>
  );
}

/** Local date-time input that stores an ISO instant. */
export function DateTimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const local = value
    ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : '';
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="datetime-local"
        value={local}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
      />
    </Field>
  );
}

function ThresholdsEditor({
  thresholds,
  onChange,
}: {
  thresholds: NonNullable<WidgetInput['thresholds']>;
  onChange: (thresholds: NonNullable<WidgetInput['thresholds']>) => void;
}) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1 text-sm font-medium">Thresholds</legend>
      <p className="text-muted-foreground mb-2 text-xs">Values at or above a threshold take its colour.</p>
      <div className="space-y-2">
        {thresholds.map((threshold, index) => (
          // eslint-disable-next-line react/no-array-index-key -- rows have no identity until saved
          <div key={index} className="flex items-center gap-2">
            <Input
              type="number"
              aria-label="Threshold value"
              className="w-32"
              value={Number.isFinite(threshold.value) ? threshold.value : ''}
              onChange={(event) =>
                onChange(
                  thresholds.map((item, i) => (i === index ? { ...item, value: Number(event.target.value) } : item)),
                )
              }
            />
            <input
              type="color"
              aria-label="Threshold colour"
              value={threshold.color}
              onChange={(event) =>
                onChange(thresholds.map((item, i) => (i === index ? { ...item, color: event.target.value } : item)))
              }
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              aria-label="Threshold label"
              placeholder="Label (optional)"
              value={threshold.label ?? ''}
              maxLength={60}
              onChange={(event) =>
                onChange(
                  thresholds.map((item, i) => (i === index ? { ...item, label: event.target.value || null } : item)),
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove threshold"
              onClick={() => onChange(thresholds.filter((_, i) => i !== index))}
            >
              <TrashIcon aria-hidden="true" />
            </Button>
          </div>
        ))}
        {thresholds.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...thresholds, { value: 0, color: '#f59e0b', label: null }])}
          >
            <PlusIcon aria-hidden="true" />
            Add threshold
          </Button>
        )}
      </div>
    </fieldset>
  );
}
