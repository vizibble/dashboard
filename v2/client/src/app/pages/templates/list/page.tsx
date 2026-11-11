import { FileTextIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { TemplatesTable } from '@/app/pages/templates/list/components/templates-table';
import { TemplateDialogs } from '@/app/pages/templates/shared/components/template-dialogs';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { useFetchTemplates } from '@/app/pages/templates/shared/hooks/use-templates-api';
import { ListMessage, ListNoMatch, ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Button } from '@/app/shared/components/ui/button';

export function TemplatesListPage() {
  const { organisation } = useOrganisationContext();
  const { openCreate, can } = useTemplateActions();
  const { templates, isLoading, isFetching, isError, refetch } = useFetchTemplates(organisation.id);
  const [search, setSearch] = useState('');

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter(
      (template) => template.name.toLowerCase().includes(query) || template.description?.toLowerCase().includes(query),
    );
  }, [search, templates]);

  const templateSkeletonColumns = [
    { id: 'name', header: 'Name', skeletonClassName: 'w-36' },
    { id: 'description', header: 'Description', skeletonClassName: 'w-64' },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-24 text-right',
      skeletonClassName: 'w-6 ml-auto',
    },
  ];

  const content = isLoading ? (
    <TableSkeleton columns={templateSkeletonColumns} rowCount={5} />
  ) : isError ? (
    <ListMessage>
      <ErrorState
        title="Could not load templates"
        message="We couldn't retrieve your templates. Please check your connection and try again."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    </ListMessage>
  ) : templates.length === 0 ? (
    <ListMessage>
      <EmptyState
        icon={FileTextIcon}
        title="No templates yet"
        description="Create a template to define the metrics your devices report."
        action={
          can.create ? (
            <Button onClick={openCreate}>
              <PlusIcon /> Create template
            </Button>
          ) : undefined
        }
      />
    </ListMessage>
  ) : visibleTemplates.length === 0 ? (
    <ListNoMatch query={search} onClear={() => setSearch('')} />
  ) : (
    <TemplatesTable templates={visibleTemplates} />
  );

  return (
    <PageContainer>
      <PageHeader
        title="Templates"
        description="Define the metrics and data types your devices report."
        actions={
          can.create && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> Create template
            </Button>
          )
        }
      />
      <ListView
        search={{ value: search, onChange: setSearch, placeholder: 'Search templates…' }}
        count={{ shown: visibleTemplates.length, total: templates.length }}
        isRefetching={!isLoading && isFetching}
      >
        {content}
      </ListView>
      <TemplateDialogs />
    </PageContainer>
  );
}
