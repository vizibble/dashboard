import { cn } from '@/app/shared/utils/cn';
import type * as React from 'react';
import { Label } from './label';

type FieldGroupProps = React.ComponentProps<'div'>;

function FieldGroup({ className, ...props }: FieldGroupProps) {
  return <div data-slot="field-group" className={cn('flex flex-col gap-4', className)} {...props} />;
}

type FieldSetProps = React.ComponentProps<'fieldset'>;

function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset data-slot="field-set" className={cn('m-0 space-y-4 border-none p-0', className)} {...props} />
  );
}

type FieldLegendProps = React.ComponentProps<'legend'>;

function FieldLegend({ className, ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('mb-2 text-base leading-none font-semibold', className)}
      {...props}
    />
  );
}

interface FieldProps extends React.ComponentProps<'div'> {
  orientation?: 'vertical' | 'horizontal';
}

function Field({ className, orientation = 'vertical', ...props }: FieldProps) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        'group/field flex',
        orientation === 'horizontal' ? 'flex-row items-center gap-2' : 'flex-col gap-1.5',
        className,
      )}
      {...props}
    />
  );
}

type FieldLabelProps = React.ComponentProps<typeof Label> & {
  required?: boolean;
};

function FieldLabel({ className, required, children, ...props }: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'text-foreground text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-hidden="true">
          *
        </span>
      )}
    </Label>
  );
}

type FieldDescriptionProps = React.ComponentProps<'p'>;

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p data-slot="field-description" className={cn('text-muted-foreground text-xs', className)} {...props} />
  );
}

interface FieldSeparatorProps extends React.ComponentProps<'div'> {
  children?: React.ReactNode;
}

function FieldSeparator({ className, children, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      className={cn('relative my-2 flex items-center justify-center text-xs uppercase', className)}
      {...props}
    >
      <div className="absolute inset-0 flex items-center">
        <span className="border-border w-full border-t" />
      </div>
      {children && (
        <span
          data-slot="field-separator-content"
          className="bg-card text-muted-foreground relative z-10 px-2.5 font-medium"
        >
          {children}
        </span>
      )}
    </div>
  );
}

type FieldErrorProps = React.ComponentProps<'p'>;

function FieldError({ className, children, ...props }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn('text-destructive text-xs font-medium', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet };
