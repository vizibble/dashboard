import { useCustomParameterForm } from '@/app/pages/templates/shared/hooks/use-custom-parameter-form';
import { DATA_TYPE_LABELS, DATA_TYPES } from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';
import { Spinner } from '@/app/shared/components/ui/spinner';

type CustomParameterFormProps = {
  initialLabel: string;
  takenKeys: Set<string>;
  onCancel: () => void;
  onCreated: (parameter: TemplateParameterInput) => void;
};

/** Inline form that adds a parameter to the organisation's catalogue and the template at once. */
export function CustomParameterForm({
  initialLabel,
  takenKeys,
  onCancel,
  onCreated,
}: CustomParameterFormProps) {
  const { label, setLabel, key, setKey, symbol, setSymbol, dataType, setDataType, error, isPending, save } =
    useCustomParameterForm({ initialLabel, takenKeys, onCreated });

  return (
    <div className="bg-muted/30 space-y-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="custom-parameter-label">Name</FieldLabel>
          <Input
            id="custom-parameter-label"
            value={label}
            placeholder="e.g. Spindle load"
            onChange={(event) => setLabel(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-key">Key the device sends</FieldLabel>
          <Input
            id="custom-parameter-key"
            value={key}
            className="font-mono"
            onChange={(event) => setKey(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-type">Value type</FieldLabel>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger id="custom-parameter-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DATA_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-parameter-symbol">Unit (optional)</FieldLabel>
          <Input
            id="custom-parameter-symbol"
            value={symbol}
            placeholder="e.g. %, N·m, bar"
            maxLength={40}
            onChange={(event) => setSymbol(event.target.value)}
          />
        </Field>
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={() => void save()} disabled={isPending}>
          {isPending && <Spinner />}
          Add parameter
        </Button>
      </div>
    </div>
  );
}
