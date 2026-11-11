import type * as React from 'react';

import { Button } from '@/app/shared/components/ui/button';
import { cn } from '@/app/shared/utils/cn';
import { ArrowClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react';

export type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  variant?: 'fullscreen' | 'inline' | 'card';
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  onRetry,
  retryLabel = 'Try again',
  isRetrying = false,
  variant = 'inline',
  className,
}: ErrorStateProps) {
  const retryButton = onRetry ? (
    <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying} className="gap-1.5">
      <ArrowClockwiseIcon className={cn('size-3.5', isRetrying && 'animate-spin')} />
      {retryLabel}
    </Button>
  ) : null;

  const content = (
    <div
      role="alert"
      className={cn(
        'border-destructive/20 bg-destructive/5 text-destructive dark:border-destructive/30 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive mb-3 flex size-10 items-center justify-center rounded-full">
        <WarningCircleIcon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">{message}</p>
      {(action || retryButton) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
          {retryButton}
        </div>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <main className="flex min-h-svh items-center justify-center px-5">
        <div className="w-full max-w-md">{content}</div>
      </main>
    );
  }

  return content;
}
