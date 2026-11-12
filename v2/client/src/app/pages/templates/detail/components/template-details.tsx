import { PencilSimpleIcon, SlidersHorizontalIcon, TrashIcon } from '@phosphor-icons/react';

import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { DATA_TYPE_LABELS, pluralise } from '@/app/pages/templates/shared/lib/parameters';
import type { Template, TemplateParameter } from '@/app/pages/templates/shared/types';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { FormField, FormSection, FormView } from '@/app/shared/components/layout/form-view';
import { Indicator, PageHeader, type PageMenuItem } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';

const PARAMETER_COLUMNS: DataTableColumn<TemplateParameter>[] = [
  {
    id: 'label',
    header: 'Parameter',
    className: 'font-medium',
    cell: (parameter) => parameter.label,
  },
  {
    id: 'key',
    header: 'Key',
    className: 'font-mono text-xs',
    cell: (parameter) => parameter.key,
  },
  {
    id: 'unit',
    header: 'Unit',
    className: 'text-muted-foreground',
    cell: (parameter) => parameter.symbol ?? '—',
  },
  {
    id: 'type',
    header: 'Value',
    cell: (parameter) => <Badge variant="secondary">{DATA_TYPE_LABELS[parameter.data_type]}</Badge>,
  },
];

export function TemplateDetails({ template }: { template: Template }) {
  const { openEdit, openDelete, openParameters, can } = useTemplateActions();

  const devices = template.device_count;

  const menu: PageMenuItem[] = [];

  if (can.update) {
    menu.push({
      label: 'Edit details',
      icon: PencilSimpleIcon,
      onSelect: () => openEdit(template.id),
    });
  }
  if (can.delete) {
    menu.push({
      label: 'Delete',
      icon: TrashIcon,
      destructive: true,
      onSelect: () => openDelete(template.id),
    });
  }

  return (
    <>
      <PageHeader
        back={{ to: '/templates', label: 'Templates' }}
        title={template.name}
        description={template.description ?? undefined}
        status={
          <Indicator tone={devices > 0 ? 'green' : 'gray'}>
            {devices > 0 ? pluralise(devices, 'device') : 'Not in use'}
          </Indicator>
        }
        menu={menu}
        actions={
          can.update && (
            <Button size="sm" onClick={() => openParameters(template.id)}>
              <SlidersHorizontalIcon /> Edit parameters
            </Button>
          )
        }
      />

      <FormView>
        <FormSection title="Details" columns={3}>
          <FormField label="Name">{template.name}</FormField>
          <FormField label="Parameters">{template.parameters.length}</FormField>
          <FormField label="Devices">{devices}</FormField>
        </FormSection>

        <FormSection
          title="Parameters"
          description="Readings every device of this template sends. Devices report each value under its key."
          columns={1}
        >
          {template.parameters.length === 0 ? (
            <EmptyState
              title="No parameters yet"
              description="Add the readings these devices send, like temperature or RPM."
              action={
                <Button variant="outline" size="sm" onClick={() => openParameters(template.id)}>
                  Add parameters
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-md border">
              <DataTable
                columns={PARAMETER_COLUMNS}
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
