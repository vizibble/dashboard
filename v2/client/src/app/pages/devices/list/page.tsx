import { CpuIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DevicesTable } from '@/app/pages/devices/list/components/devices-table';
import { DeviceDialogs } from '@/app/pages/devices/shared/components/device-dialogs';
import { useDeviceActions } from '@/app/pages/devices/shared/hooks/use-device-actions';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-device-queries';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';
import { ListMessage, ListNoMatch, ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Button } from '@/app/shared/components/ui/button';

export function DevicesListPage() {
  const { organisation } = useOrganisationContext();

  const { openCreate, can } = useDeviceActions();

  const { data: devices = [], isLoading, isFetching, isError, refetch } = useFetchDevices(organisation.id);

  const { data: locations = [] } = useFetchLocations(organisation.id);

  const [search, setSearch] = useState('');

  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  const visibleDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return devices;
    }

    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.template_name.toLowerCase().includes(query) ||
        locationsById.get(device.location_id)?.name.toLowerCase().includes(query),
    );
  }, [devices, locationsById, search]);

  const deviceSkeletonColumns = [
    { id: 'name', header: 'Name', skeletonClassName: 'w-32' },
    { id: 'template', header: 'Template', skeletonClassName: 'w-24' },
    { id: 'location', header: 'Location', skeletonClassName: 'w-28' },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-24 text-right',
      skeletonClassName: 'w-6 ml-auto',
    },
  ];

  const content = getContent();

  function getContent() {
    if (isLoading) {
      return <TableSkeleton columns={deviceSkeletonColumns} rowCount={6} />;
    }

    if (isError) {
      return (
        <ListMessage>
          <ErrorState
            title="Could not load devices"
            message="We couldn't retrieve your devices. Please check your connection and try again."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </ListMessage>
      );
    }

    if (devices.length === 0) {
      return (
        <ListMessage>
          <EmptyState
            icon={CpuIcon}
            title="No devices registered"
            description="Register your first device to start collecting telemetry."
            action={
              can.create ? (
                <Button onClick={openCreate}>
                  <PlusIcon /> Add device
                </Button>
              ) : undefined
            }
          />
        </ListMessage>
      );
    }

    if (visibleDevices.length === 0) {
      return <ListNoMatch query={search} onClear={() => setSearch('')} />;
    }

    return <DevicesTable devices={visibleDevices} locationsById={locationsById} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Devices"
        description="Register and manage the devices connected to your organisation."
        actions={
          can.create && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> Add device
            </Button>
          )
        }
      />
      <ListView
        search={{ value: search, onChange: setSearch, placeholder: 'Search by name, template or location…' }}
        count={{ shown: visibleDevices.length, total: devices.length }}
        isRefetching={!isLoading && isFetching}
      >
        {content}
      </ListView>
      <DeviceDialogs />
    </PageContainer>
  );
}
