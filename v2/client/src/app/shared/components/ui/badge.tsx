import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/app/shared/utils/cn';

const badgeVariants = cva(
  'focus:ring-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors select-none focus:ring-2 focus:ring-offset-2 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        destructive: 'bg-destructive text-destructive-foreground border-transparent shadow-xs',
        outline: 'text-foreground',
        warning: 'bg-status-warning-bg text-status-warning-fg border-transparent',
        success: 'bg-status-healthy-bg text-status-healthy-fg border-transparent',
        muted: 'bg-muted text-muted-foreground border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
