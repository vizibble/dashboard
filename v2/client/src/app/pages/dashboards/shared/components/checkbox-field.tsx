import type { ReactNode } from 'react';

import { Checkbox } from '@/app/shared/components/ui/checkbox';
import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import { cn } from '@/app/shared/utils/cn';

type CheckboxFieldProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function CheckboxField({
  id,
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
}: CheckboxFieldProps) {
  return (
    <Field orientation="horizontal" className={cn('items-center gap-2', className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <FieldLabel htmlFor={id} className="min-w-0 cursor-pointer truncate font-normal">
        {children}
      </FieldLabel>
    </Field>
  );
}
