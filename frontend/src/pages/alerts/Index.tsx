import { DataTable } from '@/components/data-table';
import { AlertRulesPanel } from '@/pages/alerts/components/alert-rules';
import { useFetchAlerts } from '@/pages/alerts/hooks/fetch-device-alerts';
import type { Alert } from '@/pages/alerts/types/types';
import type { ColumnDef } from '@tanstack/react-table';

export const AlertsPage = () => {
  const { alerts, loading } = useFetchAlerts();

  const columns: ColumnDef<Alert>[] = [
    {
      header: "Timestamp",
      accessorKey: "recorded_at",
      cell: ({ getValue }) => {
        const date = new Date(getValue<string>());
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-900 font-semibold tracking-tight">
              {date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              {date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Device",
      enableSorting: false,
      accessorKey: "device_name",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-900 font-semibold tracking-tight">
            {row.original.device_name}
          </span>
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {row.original.device_location}
          </span>
        </div>
      ),
    },
    {
      header: "Parameter",
      accessorKey: "parameter",
      enableSorting: false,
    },
    {
      header: "Value",
      accessorKey: "value",
      enableSorting: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-350 mx-auto">
        <DataTable columns={columns} data={alerts} loading={loading}>
          <DataTable.Toolbar 
            title="Alerts" 
            actions={<AlertRulesPanel />}
          />
          <DataTable.Content />
          <DataTable.Pagination />
        </DataTable>
      </div>
    </div>
  );
};
