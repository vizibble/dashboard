import { CheckboxField } from '@/app/pages/dashboards/shared/components/checkbox-field';
import { NumberField } from '@/app/pages/dashboards/shared/components/number-field';
import { ThresholdsEditor } from '@/app/pages/dashboards/shared/components/thresholds-editor';
import type { WidgetEditor } from '@/app/pages/dashboards/shared/hooks/use-widget-editor';
import { hasValueRange, isNumericMetric, isTimeSeries } from '@/app/pages/dashboards/shared/lib/widget-input';
import { Button } from '@/app/shared/components/ui/button';
import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';

const AUTOMATIC = 'inherit';

type WidgetDisplayStepProps = {
  editor: WidgetEditor;
};

/** Step 3: title plus the display settings that fit the parameter's kind of value. */
export function WidgetDisplayStep({ editor }: WidgetDisplayStepProps) {
  const { values, set, metric, error, changeTitle } = editor;

  const showLegendOption = isTimeSeries(values.type) || values.type === 'state';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="widget-title" required>
          Title
        </FieldLabel>
        <Input
          id="widget-title"
          value={values.title}
          maxLength={160}
          onChange={(event) => changeTitle(event.target.value)}
          aria-invalid={Boolean(error && !values.title.trim())}
        />
      </Field>
      {isNumericMetric(metric) && <NumericDisplayFields editor={editor} />}
      {metric?.data_type === 'boolean' && <BooleanDisplayFields editor={editor} />}
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
        {showLegendOption && (
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
  );
}

function NumericDisplayFields({ editor }: WidgetDisplayStepProps) {
  const { values, set } = editor;

  const rangeLabel = values.type === 'gauge' ? 'Gauge' : 'Axis';

  return (
    <>
      <Field>
        <FieldLabel htmlFor="widget-decimals">Decimal places</FieldLabel>
        <Select
          value={values.decimals == null ? AUTOMATIC : String(values.decimals)}
          onValueChange={(value) => set('decimals', value === AUTOMATIC ? null : Number(value))}
        >
          <SelectTrigger id="widget-decimals" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTOMATIC}>Automatic</SelectItem>
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
      {hasValueRange(values.type) && (
        <>
          <NumberField
            id="widget-min"
            label={`${rangeLabel} minimum`}
            value={values.min_value ?? null}
            onChange={(value) => set('min_value', value)}
          />
          <NumberField
            id="widget-max"
            label={`${rangeLabel} maximum`}
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
  );
}

function BooleanDisplayFields({ editor }: WidgetDisplayStepProps) {
  const { values, set } = editor;

  return (
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
  );
}
