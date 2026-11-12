import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';

type NumberFieldProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

/** Optional number; an empty input means "automatic". */
export function NumberField({ id, label, value, onChange }: NumberFieldProps) {
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
