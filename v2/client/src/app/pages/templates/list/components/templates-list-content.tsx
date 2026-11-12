import { FileTextIcon, PlusIcon } from '@phosphor-icons/react';

import { TemplatesTable } from '@/app/pages/templates/list/components/templates-table';
import type { TemplateSummary } from '@/app/pages/templates/shared/types';
import { ListMessage, ListNoMatch } from '@/app/shared/components/layout/list-view';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Button } from '@/app/shared/components/ui/button';

const SKELETON_COLUMNS = [
  { id: 'name', header: 'Name', skeletonClassName: 'w-36' },
  { id: 'description', header: 'Description', skeletonClassName: 'w-64' },
  {
    id: 'actions',
    header: <span className="sr-only">Actions</span>,
    className: 'w-24 text-right',
    skeletonClassName: 'w-6 ml-auto',
  },
];

type TemplatesListContentProps = {
  templates: TemplateSummary[];
  visibleTemplates: TemplateSummary[];
  search: string;
  onClearSearch: () => void;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  /** Omitted when the member can't create templates. */
  onCreate?: () => void;
};

/** Loading, error, empty, no-match or the table. */
export function TemplatesListContent({
  templates,
  visibleTemplates,
  search,
  onClearSearch,
  isLoading,
  isError,
  isRetrying,
  onRetry,
  onCreate,
}: TemplatesListContentProps) {
  if (isLoading) {
    return <TableSkeleton columns={SKELETON_COLUMNS} rowCount={5} />;
  }

  if (isError) {
    return (
      <ListMessage>
        <ErrorState
          title="Could not load templates"
          message="We couldn't retrieve your templates. Please check your connection and try again."
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      </ListMessage>
    );
  }

  if (templates.length === 0) {
    return (
      <ListMessage>
        <EmptyState
          icon={FileTextIcon}
          title="No templates yet"
          description="Create a template to define the metrics your devices report."
          action={
            onCreate && (
              <Button onClick={onCreate}>
                <PlusIcon /> Create template
              </Button>
            )
          }
        />
      </ListMessage>
    );
  }

  if (visibleTemplates.length === 0) {
    return <ListNoMatch query={search} onClear={onClearSearch} />;
  }

  return <TemplatesTable templates={visibleTemplates} />;
}
