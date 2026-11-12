import { Link } from 'react-router-dom';

import { useDeviceActions } from '@/app/pages/devices/shared/hooks/use-device-actions';
import type { Device } from '@/app/pages/devices/shared/types';
import type { Location } from '@/app/pages/locations/shared/types';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { RowActions } from '@/app/shared/components/row-actions';

type DevicesTableProps = {
  devices: Device[];
  locationsById: Map<string, Location>;
};

export function DevicesTable({ devices, locationsById }: DevicesTableProps) {
  const { openEdit, openDelete, can } = useDeviceActions();

  const columns: DataTableColumn<Device>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (device) => (
        <Link to={`/devices/${device.id}`} className="hover:text-primary font-medium">
          {device.name}
        </Link>
      ),
    },
    {
      id: 'template',
      header: 'Template',
      cell: (device) => (
        <Link to={`/templates/${device.template_id}`} className="hover:text-primary">
          {device.template_name}
        </Link>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      className: 'text-muted-foreground',
      cell: (device) => {
        const location = locationsById.get(device.location_id);

        return location ? (
          <Link to={`/locations/${location.id}`} className="hover:text-foreground">
            {location.name}
          </Link>
        ) : (
          '—'
        );
      },
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-24 text-right',
      cell: (device) => (
        <RowActions
          label={device.name}
          onEdit={can.update ? () => openEdit(device.id) : undefined}
          onDelete={can.delete ? () => openDelete(device.id) : undefined}
        />
      ),
    },
  ];

  return <DataTable columns={columns} rows={devices} getRowId={(device) => device.id} />;
}
