import { Link } from 'react-router-dom';

import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import type { TemplateSummary } from '@/app/pages/templates/shared/types';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { RowActions } from '@/app/shared/components/row-actions';

export function TemplatesTable({ templates }: { templates: TemplateSummary[] }) {
  const { openEdit, openDelete, can } = useTemplateActions();

  const columns: DataTableColumn<TemplateSummary>[] = [
    {
      id: 'name',
      header: 'Template',
      cell: (template) => (
        <Link to={`/templates/${template.id}`} className="hover:text-primary font-medium">
          {template.name}
        </Link>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      className: 'text-muted-foreground max-w-md truncate',
      cell: (template) => template.description ?? '—',
    },
    { id: 'parameters', header: 'Parameters', className: 'w-28', cell: (template) => template.parameter_count },
    { id: 'devices', header: 'Devices', className: 'w-24', cell: (template) => template.device_count },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-24 text-right',
      cell: (template) => (
        <RowActions
          label={template.name}
          onEdit={can.update ? () => openEdit(template.id) : undefined}
          onDelete={can.delete ? () => openDelete(template.id) : undefined}
        />
      ),
    },
  ];

  return <DataTable columns={columns} rows={templates} getRowId={(template) => template.id} />;
}
