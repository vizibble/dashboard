import { Spinner } from '@/app/shared/components/ui/spinner';
import { cn } from '@/app/shared/utils/cn';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-interactive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'press bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
        destructive:
          'press bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-white shadow-xs',
        outline:
          'press border-input bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs',
        secondary: 'press bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs',
        ghost: 'press hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // The second has-[] keeps icon padding identical while content is wrapped for loading.
        default: 'h-9 px-4 py-2 has-[>[data-slot=button-label]>svg]:px-3 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3 text-xs has-[>[data-slot=button-label]>svg]:px-2.5 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 text-base has-[>[data-slot=button-label]>svg]:px-4 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: React.ReactNode;
  };

const layer =
  'col-start-1 row-start-1 inline-flex items-center justify-center gap-[inherit] transition-opacity';

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    );
  }

  // Buttons that declare loadingText keep both labels mounted in one grid cell, so the
  // button is always as wide as the longer one and never resizes when loading toggles.
  const stacked = loading || loadingText !== undefined;

  return (
    <button
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {stacked ? (
        <span data-slot="button-label" className="grid gap-[inherit]">
          <span
            className={cn(layer, 'duration-(--motion-fast)', loading && 'opacity-0')}
            aria-hidden={loading || undefined}
          >
            {children}
          </span>
          <span
            className={cn(layer, 'duration-(--motion-fast)', !loading && 'opacity-0')}
            aria-hidden={!loading || undefined}
          >
            {loading && <Spinner className="size-4 shrink-0" />}
            {loadingText}
          </span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export { Button, buttonVariants };
