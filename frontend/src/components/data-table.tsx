import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { createContext, type ReactNode, useContext, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TableInstance,
  useReactTable,
} from '@tanstack/react-table';

// Context
interface DataTableContextValue<T> {
  table: TableInstance<T>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  showFilter: boolean;
  setShowFilter: (value: boolean) => void;
  loading?: boolean;
}
const DataTableContext = createContext<DataTableContextValue<unknown> | null>(
  null
);

function useDataTableContext<T>() {
  const context = useContext(DataTableContext);
  if (!context)
    throw new Error('DataTable must be rendered within a DataTable.Root');
  return context as unknown as DataTableContextValue<T>;
}

// Root Component
interface DataTableRootProps<T> {
  children: ReactNode;
  columns: ColumnDef<T>[];
  data: T[];
  initialPageSize?: number;
  loading?: boolean;
}
const Root = <T extends object>({
  children,
  columns,
  data,
  initialPageSize = 10,
  loading,
}: DataTableRootProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  return (
    <DataTableContext.Provider
      value={
        {
          table,
          globalFilter,
          setGlobalFilter,
          showFilter,
          setShowFilter,
          loading,
        } as unknown as DataTableContextValue<unknown>
      }
    >
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden flex flex-col h-full">
        {children}
      </div>
    </DataTableContext.Provider>
  );
};

// Toolbar Component
interface DataTableToolbarProps {
  title: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
}
const Toolbar = ({
  title,
  showSearch = true,
  actions,
}: DataTableToolbarProps) => {
  const { globalFilter, setGlobalFilter, showFilter, setShowFilter } =
    useDataTableContext();

  return (
    <div className="px-4 md:px-6 py-4 flex flex-col gap-4 border-b">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold leading-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {actions}
          {showSearch && (
            <Button
              className="size-8"
              variant={showFilter ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Search className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {showFilter && showSearch && (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="pl-10"
            value={globalFilter ?? ''}
            placeholder="Search records..."
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Table Body/Content
const Content = () => {
  const { table, loading } = useDataTableContext();

  return (
    <div className="overflow-x-auto grow">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="px-4 md:px-6 h-12 text-[13px] font-medium text-primary whitespace-nowrap"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={`flex items-center gap-1.5 select-none ${header.column.getCanSort() ? 'cursor-pointer hover:text-primary' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-muted-foreground">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="text-primary" size={12} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="text-primary" size={12} />
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                className="h-24 text-center"
                colSpan={table.getAllColumns().length}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Spinner className="size-5 text-primary" />
                  <span>Loading records...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 md:px-6 py-4 text-[11px] md:text-[12px] whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground italic"
                colSpan={table.getAllColumns().length}
              >
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const Pagination = () => {
  const { table } = useDataTableContext();
  const pagination = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startIndex = Math.max(
    0,
    pagination.pageIndex * pagination.pageSize + 1
  );
  const endIndex = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows
  );

  return (
    <div className="px-4 md:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground text-[13px] bg-card">
      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground font-medium whitespace-nowrap">
          {totalRows > 0
            ? `${startIndex} - ${endIndex} of ${totalRows}`
            : '0 of 0'}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          className="hidden h-8 w-8 p-0 lg:flex"
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.setPageIndex(0)}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          className="h-8 w-8 p-0"
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex w-[40px] items-center justify-center text-sm font-medium">
          {pagination.pageIndex + 1}
        </div>
        <Button
          className="h-8 w-8 p-0"
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          className="hidden h-8 w-8 p-0 lg:flex"
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Main Export
export const DataTable = Object.assign(Root, {
  Toolbar,
  Content,
  Pagination,
});
