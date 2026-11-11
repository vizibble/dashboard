import { Skeleton } from '@/app/shared/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/shared/components/ui/table';
import { cn } from '@/app/shared/utils/cn';
import type * as React from 'react';

export type TableSkeletonProps = {
  columns: {
    id: string;
    header?: React.ReactNode;
    className?: string;
    skeletonClassName?: string;
  }[];
  rowCount?: number;
  className?: string;
};

/**
 * Dedicated skeleton matching the exact geometry of a DataTable:
 * - Table header row with matching column widths
 * - Alternating/compact rows with individual cell placeholders
 */
export function TableSkeleton({ columns, rowCount = 5, className }: TableSkeletonProps) {
  return (
    <Table className={cn('min-w-[480px]', className)}>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column.id} className={cn('text-muted-foreground h-9 px-4 text-xs', column.className)}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-transparent">
            {columns.map((column) => (
              <TableCell key={column.id} className={cn('px-4 py-3', column.className)}>
                <Skeleton className={cn('h-4 w-3/4 max-w-[180px]', column.skeletonClassName)} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Generic row/list skeleton for flat items.
 */
export function ListSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('divide-y', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * TreeSkeleton specifically represents hierarchical nodes with indentation lines,
 * chevron placeholders, and branching lines matching LocationTree.
 */
export function TreeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-1 p-2', className)}>
      {/* Root node 1 */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="size-4 shrink-0 rounded-xs" />
        <Skeleton className="h-4 w-44" />
        <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
      </div>

      {/* Child 1.1 */}
      <div className="border-border/60 ml-3.5 space-y-1 border-l pl-3">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-2 shrink-0 rounded-full opacity-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-4 shrink-0 rounded-xs" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
        </div>

        {/* Grandchild 1.1.1 */}
        <div className="border-border/60 ml-3.5 border-l pl-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="size-2 shrink-0 rounded-full opacity-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
          </div>
        </div>
      </div>

      {/* Root node 2 */}
      <div className="flex items-center gap-2 px-2 py-1.5 pt-2">
        <Skeleton className="size-4 shrink-0 rounded-xs" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
      </div>

      {/* Child 2.1 */}
      <div className="border-border/60 ml-3.5 border-l pl-3">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-2 shrink-0 rounded-full opacity-40" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto size-6 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}
