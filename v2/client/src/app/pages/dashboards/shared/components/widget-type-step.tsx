import { widgetTypes } from '@vizibble/shared/dashboards';

import { WIDGET_TYPE_LABELS } from '@/app/pages/dashboards/shared/lib/labels';
import type { WidgetType } from '@/app/pages/dashboards/shared/types';
import { cn } from '@/app/shared/utils/cn';

type WidgetTypeStepProps = {
  value: WidgetType;
  onChange: (type: WidgetType) => void;
};

/** Step 1: choose the visualisation. */
export function WidgetTypeStep({ value, onChange }: WidgetTypeStepProps) {
  return (
    <fieldset>
      <legend className="sr-only">Visualisation</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {widgetTypes.map((type) => (
          <label
            key={type}
            className={cn(
              'hover:bg-muted/60 has-focus-visible:ring-ring cursor-pointer rounded-md border p-3 has-focus-visible:ring-2',
              value === type && 'border-primary bg-primary/5',
            )}
          >
            <input
              type="radio"
              name="widget-type"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
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
  );
}
