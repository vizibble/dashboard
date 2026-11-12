import { toLocalInputValue } from '@/app/pages/dashboards/shared/lib/format';
import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';

type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

/** Local date-time input that stores an ISO instant. */
export function DateTimeField({ id, label, value, onChange }: DateTimeFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="datetime-local"
        value={toLocalInputValue(value)}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
      />
    </Field>
  );
}
