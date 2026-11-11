import { DashboardWorkspace } from '@/app/pages/dashboards/shared/components/dashboard-workspace';
import { PageContainer } from '@/app/shared/components/layout/page-container';

/** Organisation-wide dashboards. */
export function DashboardPage() {
  return (
    <PageContainer size="full">
      <DashboardWorkspace target={{ scope: 'organisation' }} variant="page" />
    </PageContainer>
  );
}
