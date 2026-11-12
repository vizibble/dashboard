import { useNavigate, useParams } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DashboardWorkspace } from '@/app/pages/dashboards/shared/components/dashboard-workspace';
import { DeviceDetails } from '@/app/pages/devices/detail/components/device-details';
import { DeviceDialogs } from '@/app/pages/devices/shared/components/device-dialogs';
import { useFetchDevice } from '@/app/pages/devices/shared/hooks/use-device-queries';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Button } from '@/app/shared/components/ui/button';
import { Skeleton } from '@/app/shared/components/ui/skeleton';

const BACK = { to: '/devices', label: 'Devices' };

export function DeviceDetailPage() {
  const navigate = useNavigate();

  const { organisation } = useOrganisationContext();

  const { deviceId } = useParams();

  const { data: device, isPending, isError, refetch } = useFetchDevice(organisation.id, deviceId);

  if (isPending) {
    return (
      <PageContainer>
        <PageHeader title="Device" back={BACK} />
        <div className="bg-card space-y-6 rounded-lg border p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !device) {
    return (
      <PageContainer>
        <PageHeader title="Device" back={BACK} />
        <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
          <ErrorState
            title="Device not found"
            message="This device could not be loaded or may have been deleted."
            variant="inline"
            onRetry={() => void refetch()}
            action={
              <Button variant="outline" size="sm" onClick={() => void navigate('/devices')}>
                Back to all devices
              </Button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DeviceDetails device={device} />
      <DashboardWorkspace
        target={{ scope: 'device', deviceId: device.id }}
        variant="section"
        title="Telemetry"
      />
      <DeviceDialogs />
    </PageContainer>
  );
}
