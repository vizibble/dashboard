import { KeyIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useDeviceActions } from '@/app/pages/devices/shared/hooks/use-device-actions';
import type { Device } from '@/app/pages/devices/shared/types';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';
import { getLocationPath } from '@/app/pages/locations/shared/lib/get-location-path';
import { useFetchTemplate } from '@/app/pages/templates/shared/hooks/use-templates-api';
import { DATA_TYPE_LABELS } from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameter } from '@/app/pages/templates/shared/types';
import { CopyIdButton } from '@/app/shared/components/copy-id-button';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { FormField, FormSection, FormView } from '@/app/shared/components/layout/form-view';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';

const TELEMETRY_COLUMNS: DataTableColumn<TemplateParameter>[] = [
  { id: 'label', header: 'Parameter', className: 'font-medium', cell: (parameter) => parameter.label },
  { id: 'key', header: 'Key to send', className: 'font-mono text-xs', cell: (parameter) => parameter.key },
  { id: 'unit', header: 'Unit', className: 'text-muted-foreground', cell: (parameter) => parameter.symbol ?? '—' },
  {
    id: 'type',
    header: 'Value',
    cell: (parameter) => <Badge variant="secondary">{DATA_TYPE_LABELS[parameter.data_type]}</Badge>,
  },
];

export function DeviceDetails({ device }: { device: Device }) {
  const { organisation } = useOrganisationContext();
  const { openEdit, openDelete, openRotateKey, can } = useDeviceActions();
  const { locations } = useFetchLocations(organisation.id);
  const { template, isPending: isTemplatePending } = useFetchTemplate(organisation.id, device.template_id);

  const location = locations.find((item) => item.id === device.location_id);
  const locationPath = location
    ? getLocationPath(location, new Map(locations.map((item) => [item.id, item])))
        .map((item) => item.name)
        .join(' / ')
    : undefined;

  return (
    <>
      <PageHeader
        back={{ to: '/devices', label: 'Devices' }}
        title={device.name}
        description={device.template_name}
        menu={[
          ...(can.update ? [{ label: 'Rotate key', icon: KeyIcon, onSelect: () => openRotateKey(device.id) }] : []),
          ...(can.delete
            ? [{ label: 'Delete', icon: TrashIcon, destructive: true, onSelect: () => openDelete(device.id) }]
            : []),
        ]}
        actions={
          can.update && (
            <Button variant="outline" size="sm" onClick={() => openEdit(device.id)}>
              <PencilSimpleIcon /> Edit
            </Button>
          )
        }
      />

      <FormView>
        <FormSection title="Device">
          <FormField label="Template">
            <Link to={`/templates/${device.template_id}`} className="hover:text-primary">
              {device.template_name}
            </Link>
          </FormField>
          <FormField label="Location">
            {location && (
              <Link to={`/locations/${location.id}`} className="hover:text-primary">
                {locationPath}
              </Link>
            )}
          </FormField>
          <FormField label="Device ID">
            <CopyIdButton id={device.id} truncateLength={16} />
          </FormField>
        </FormSection>

        <FormSection
          title="Telemetry"
          description="Readings this device sends, as defined by its template."
          columns={1}
        >
          {isTemplatePending ? (
            <TableSkeleton
              columns={[
                { id: 'label', header: 'Parameter', skeletonClassName: 'w-24' },
                { id: 'key', header: 'Key to send', skeletonClassName: 'w-20' },
                { id: 'unit', header: 'Unit', skeletonClassName: 'w-12' },
                { id: 'type', header: 'Value', skeletonClassName: 'w-16' },
              ]}
              rowCount={3}
            />
          ) : !template || template.parameters.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Its template has no parameters yet.{' '}
              <Link to={`/templates/${device.template_id}`} className="text-primary hover:underline">
                Add some
              </Link>
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <DataTable
                columns={TELEMETRY_COLUMNS}
                rows={template.parameters}
                getRowId={(parameter) => parameter.id}
              />
            </div>
          )}
        </FormSection>
      </FormView>
    </>
  );
}
