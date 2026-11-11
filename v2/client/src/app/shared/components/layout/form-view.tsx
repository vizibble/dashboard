import type * as React from 'react';

import { cn } from '@/app/shared/utils/cn';

/**
 * ERPNext-style form/detail view: one bordered panel, split into <FormSection>s by dividers.
 */
export function FormView({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-card divide-y overflow-hidden rounded-lg border', className)}>{children}</div>;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

type FormSectionProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** Field columns. Use 1 for tables or free content. */
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, actions, columns = 2, children, className }: FormSectionProps) {
  return (
    <section className={cn('px-4 py-5 sm:px-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('grid gap-x-8 gap-y-4', columnClasses[columns])}>{children}</div>
    </section>
  );
}

type FormFieldProps = {
  label: string;
  /** Help text under the value. */
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

/** Read-only field: small label above a muted value box, like ERPNext's read-only controls. */
export function FormField({ label, description, children, className }: FormFieldProps) {
  const isEmpty = children === undefined || children === null || children === '';
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-muted-foreground mb-1.5 text-xs">{label}</p>
      <div className="bg-muted/60 flex min-h-8 items-center rounded-md px-3 py-1.5 text-sm break-words">
        {isEmpty ? <span className="text-muted-foreground">—</span> : children}
      </div>
      {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
    </div>
  );
}
