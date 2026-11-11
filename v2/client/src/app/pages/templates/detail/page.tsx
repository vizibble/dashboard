import { useNavigate, useParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { TemplateDetails } from '@/app/pages/templates/detail/components/template-details';
import { TemplateDialogs } from '@/app/pages/templates/shared/components/template-dialogs';
import { useFetchTemplate } from '@/app/pages/templates/shared/hooks/use-templates-api';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Button } from '@/app/shared/components/ui/button';
import { Skeleton } from '@/app/shared/components/ui/skeleton';

const BACK = { to: '/templates', label: 'Templates' };

export function TemplateDetailPage() {
  const navigate = useNavigate();
  const { organisation } = useOrganisationContext();
  const { templateId } = useParams();
  const { template, isPending, isError, refetch } = useFetchTemplate(organisation.id, templateId);

  if (isPending) {
    return (
      <PageContainer>
        <PageHeader title="Template" back={BACK} />
        <div className="bg-card space-y-6 rounded-lg border p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !template) {
    return (
      <PageContainer>
        <PageHeader title="Template" back={BACK} />
        <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
          <ErrorState
            title="Template not found"
            message="This template could not be loaded or may have been deleted."
            variant="inline"
            onRetry={() => void refetch()}
            action={
              <Button variant="outline" size="sm" onClick={() => void navigate('/templates')}>
                Back to all templates
              </Button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TemplateDetails template={template} />
      <TemplateDialogs />
    </PageContainer>
  );
}
