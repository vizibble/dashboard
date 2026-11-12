import { PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { TemplatesListContent } from '@/app/pages/templates/list/components/templates-list-content';
import { TemplateDialogs } from '@/app/pages/templates/shared/components/template-dialogs';
import { useTemplateActions } from '@/app/pages/templates/shared/hooks/use-template-actions';
import { useFetchTemplates } from '@/app/pages/templates/shared/hooks/use-template-queries';
import { ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { Button } from '@/app/shared/components/ui/button';

export function TemplatesListPage() {
  const { organisation } = useOrganisationContext();

  const { openCreate, can } = useTemplateActions();

  const {
    data: templates = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useFetchTemplates(organisation.id);

  const [search, setSearch] = useState('');

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return templates;
    }

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) || template.description?.toLowerCase().includes(query),
    );
  }, [search, templates]);

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
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search templates…',
        }}
        count={{ shown: visibleTemplates.length, total: templates.length }}
        isRefetching={!isLoading && isFetching}
      >
        <TemplatesListContent
          templates={templates}
          visibleTemplates={visibleTemplates}
          search={search}
          onClearSearch={() => setSearch('')}
          isLoading={isLoading}
          isError={isError}
          isRetrying={isFetching}
          onRetry={() => void refetch()}
          onCreate={can.create ? openCreate : undefined}
        />
      </ListView>
      <TemplateDialogs />
    </PageContainer>
  );
}
