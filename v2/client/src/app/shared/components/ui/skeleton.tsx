import { cn } from '@/app/shared/utils/cn';
import type * as React from 'react';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('bg-muted/70 animate-pulse rounded-md', className)} {...props} />;
}
