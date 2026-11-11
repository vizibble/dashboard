import { MapPinIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { LocationTree } from '@/app/pages/locations/list/components/location-tree';
import { LocationDialogs } from '@/app/pages/locations/shared/components/location-dialogs';
import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';
import { buildLocationTree } from '@/app/pages/locations/shared/lib/build-location-tree';

import { ListMessage, ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TreeSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Button } from '@/app/shared/components/ui/button';

export function LocationsTreePage() {
  const { organisation } = useOrganisationContext();
  const { openCreate, can } = useLocationActions();
  const { locations, isLoading, isFetching, isError, refetch } = useFetchLocations(organisation.id);
  const tree = useMemo(() => buildLocationTree(locations), [locations]);

  const content = isLoading ? (
    <TreeSkeleton />
  ) : isError ? (
    <ListMessage>
      <ErrorState
        title="Unable to load locations"
        message="We couldn't retrieve your locations. Please verify your connection and try again."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    </ListMessage>
  ) : locations.length === 0 ? (
    <ListMessage>
      <EmptyState
        icon={MapPinIcon}
        title="No locations yet"
        description="Create your first location to organise your spaces and sensor zones."
        action={
          can.create ? (
            <Button onClick={() => openCreate()} className="gap-1.5 text-xs font-medium">
              <PlusIcon size={14} weight="bold" aria-hidden="true" />
              Add Location
            </Button>
          ) : undefined
        }
      />
    </ListMessage>
  ) : (
    <div className="p-2">
      <LocationTree nodes={tree} />
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Locations"
        description="Organise your spaces, facilities, and sensor deployment zones."
        actions={
          can.create && (
            <Button size="sm" onClick={() => openCreate()}>
              <PlusIcon /> Add location
            </Button>
          )
        }
      />
      <ListView
        count={locations.length > 0 ? { shown: locations.length, total: locations.length } : undefined}
        isRefetching={!isLoading && isFetching}
      >
        {content}
      </ListView>
      <LocationDialogs />
    </PageContainer>
  );
}
