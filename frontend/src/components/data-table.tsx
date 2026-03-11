import { createContext, type ReactNode, useContext, useState } from 'react';

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

import { Loader } from '@/components/loader';
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
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
    <div className="px-4 md:px-6 py-4 flex flex-col gap-4 border-b border-slate-100">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-slate-700 leading-tight">
          {title}
        </h2>
        <div className="flex items-center gap-3 md:gap-5 text-slate-400">
          {actions}
          {showSearch && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-slate-50 ${showFilter ? 'text-blue-500 bg-blue-50' : ''}`}
            >
              <Search size={20} />
            </button>
          )}
        </div>
      </div>

      {showFilter && showSearch && (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
    <div className="overflow-x-auto flex-grow scrollbar-thin scrollbar-thumb-slate-200">
      <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-100 bg-white"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 md:px-6 py-3.5 text-[13px] md:text-[14px] font-medium text-blue-500 whitespace-nowrap"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={`flex items-center gap-1.5 select-none ${header.column.getCanSort() ? 'cursor-pointer hover:text-blue-600' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-slate-400">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp size={12} className="text-blue-500" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown size={12} className="text-blue-500" />
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="px-6 py-10 text-center"
              >
                <Loader
                  text="Loading records..."
                  className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400"
                  spinnerClassName="w-5 h-5 animate-spin text-blue-500"
                />
              </td>
            </tr>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/50 transition-colors duration-200"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 md:px-6 py-4 text-[11px] md:text-[12px] text-slate-600 font-[450] whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="px-6 py-10 text-center text-slate-400 italic"
              >
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Pagination = () => {
  const { table } = useDataTableContext();
  const pagination = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startIndex = pagination.pageIndex * pagination.pageSize + 1;
  const endIndex = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows
  );

  return (
    <div className="px-4 md:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[13px] bg-white">
      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="hidden xs:inline">Items per page:</span>
          <div className="relative group">
            <select
              value={pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="appearance-none bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-md focus:ring-0 cursor-pointer font-medium text-slate-600 focus:outline-none pr-8"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-400 group-hover:border-t-slate-600 transition-colors" />
          </div>
        </div>

        <div className="text-slate-500 font-medium whitespace-nowrap">
          {totalRows > 0
            ? `Showing ${startIndex} - ${endIndex} of ${totalRows} records`
            : 'No records to show'}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="p-2 text-slate-400 hover:text-blue-500 disabled:text-slate-200 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-slate-50 rounded-md"
          title="First Page"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-2 text-slate-400 hover:text-blue-500 disabled:text-slate-200 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-slate-50 rounded-md"
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="px-3 py-1 bg-slate-50 rounded-md text-blue-600 font-semibold border border-slate-100">
          {pagination.pageIndex + 1}
        </div>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-2 text-slate-400 hover:text-blue-500 disabled:text-slate-200 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-slate-50 rounded-md"
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="p-2 text-slate-400 hover:text-blue-500 disabled:text-slate-200 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-slate-50 rounded-md"
          title="Last Page"
        >
          <ChevronsRight size={18} />
        </button>
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
