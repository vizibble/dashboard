import { Button } from '@/app/shared/components/ui/button';
import { cn } from '@/app/shared/utils/cn';
import type * as React from 'react';

export type EmptyStateProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
      {Icon && (
        <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-xl shadow-xs">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function EmptySearchResult({
  query,
  onClear,
  className,
}: {
  query?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-10 text-center', className)}>
      <p className="text-foreground text-sm font-medium">
        {query ? <>No results found for &ldquo;{query}&rdquo;</> : 'No matching results'}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">Try adjusting your search terms or clearing active filters.</p>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}
