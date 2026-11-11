import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/shared/components/ui/table';
import { cn } from '@/app/shared/utils/cn';
import { transition } from '@/app/shared/utils/motion';

const MotionTableRow = motion.create(TableRow);

/** Above this, insert/remove fades are skipped: they stop reading as feedback and start costing frames. */
const ANIMATED_ROW_LIMIT = 100;

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Applied to both header and cell, e.g. 'w-24 text-right'. */
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  className?: string;
};

/** Column-driven table on top of shadcn <Table>, styled like an ERPNext list (muted header, compact rows). */
export function DataTable<T>({ columns, rows, getRowId, className }: DataTableProps<T>) {
  const animateRows = rows.length <= ANIMATED_ROW_LIMIT;
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
        {/* initial={false}: the first page of rows appears instantly; only later inserts/removals fade. */}
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <MotionTableRow
              key={getRowId(row)}
              initial={animateRows ? { opacity: 0 } : false}
              animate={{ opacity: 1, transition: transition.enter }}
              exit={animateRows ? { opacity: 0, transition: transition.exit } : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.id} className={cn('px-4 py-2.5', column.className)}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </MotionTableRow>
          ))}
        </AnimatePresence>
      </TableBody>
    </Table>
  );
}
