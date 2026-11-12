import { PlusIcon, TrashIcon } from '@phosphor-icons/react';

import type { WidgetInput } from '@/app/pages/dashboards/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import { Input } from '@/app/shared/components/ui/input';

type Thresholds = NonNullable<WidgetInput['thresholds']>;

type ThresholdsEditorProps = {
  thresholds: Thresholds;
  onChange: (thresholds: Thresholds) => void;
};

export function ThresholdsEditor({ thresholds, onChange }: ThresholdsEditorProps) {
  const update = (index: number, patch: Partial<Thresholds[number]>) =>
    onChange(thresholds.map((item, i) => (i === index ? { ...item, ...patch } : item)));

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
              onChange={(event) => update(index, { value: Number(event.target.value) })}
            />
            <input
              type="color"
              aria-label="Threshold colour"
              value={threshold.color}
              onChange={(event) => update(index, { color: event.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              aria-label="Threshold label"
              placeholder="Label (optional)"
              value={threshold.label ?? ''}
              maxLength={60}
              onChange={(event) => update(index, { label: event.target.value || null })}
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
