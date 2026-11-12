import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type * as React from 'react';

import { EmptySearchResult } from '@/app/shared/components/states/empty-state';
import { Input } from '@/app/shared/components/ui/input';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { cn } from '@/app/shared/utils/cn';

type ListViewProps = {
  /** Search box in the filter bar. Omit to hide it. */
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  /** Extra filter controls shown next to search. */
  filters?: React.ReactNode;
  /** Shown in the footer, e.g. { shown: 8, total: 20 } → "8 of 20". */
  count?: { shown: number; total: number };
  /** Visual indicator that a background refetch is happening without replacing content */
  isRefetching?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * ERPNext-style list view: filter bar, rows, and a count footer in one bordered panel.
 * Put a <ListTable>, a <ListMessage> or any custom rows inside.
 */
export function ListView({ search, filters, count, isRefetching, children, className }: ListViewProps) {
  return (
    <section className={cn('bg-card relative overflow-hidden rounded-lg border', className)}>
      {(search || filters || isRefetching) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {search && (
              <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon
                  size={14}
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder={search.placeholder ?? 'Search…'}
                  aria-label={search.placeholder ?? 'Search'}
                  className="bg-muted/60 h-8 border-transparent pl-8 text-sm shadow-none"
                />
              </div>
            )}
            {filters}
          </div>
          {isRefetching && (
            <div className="text-muted-foreground flex items-center gap-1.5 px-2 text-xs">
              <Spinner className="size-3 animate-spin" />
              <span>Updating…</span>
            </div>
          )}
        </div>
      )}
      {children}
      {count && count.total > 0 && (
        <footer className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
          <span>
            {count.shown === count.total ? `${count.total} records` : `${count.shown} of ${count.total}`}
          </span>
          {isRefetching && <span className="text-[11px] opacity-75">Syncing in background</span>}
        </footer>
      )}
    </section>
  );
}

/** Centered message inside a list: loading, empty, error or "no match". */
export function ListMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex min-h-60 items-center justify-center p-8', className)}>{children}</div>;
}

/** Ready-made "no results for search" message. */
export function ListNoMatch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <ListMessage>
      <EmptySearchResult query={query} onClear={onClear} />
    </ListMessage>
  );
}
