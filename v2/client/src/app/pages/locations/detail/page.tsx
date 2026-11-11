import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Button } from '@/app/shared/components/ui/button';
import { Skeleton } from '@/app/shared/components/ui/skeleton';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DashboardWorkspace } from '@/app/pages/dashboards/shared/components/dashboard-workspace';
import { LocationDetails } from '@/app/pages/locations/detail/components/location-details';
import { LocationDialogs } from '@/app/pages/locations/shared/components/location-dialogs';
import { useFetchLocation, useFetchLocations } from '@/app/pages/locations/shared/hooks/use-locations-api';

export function LocationDetailPage() {
  const { organisation } = useOrganisationContext();
  const { locationId } = useParams();

  const { locations, isPending: isLocationsPending } = useFetchLocations(organisation.id);

  const detailQuery = useFetchLocation(organisation.id, locationId);

  const locationsById = useMemo(() => new Map(locations.map((loc) => [loc.id, loc])), [locations]);

  if (detailQuery.isPending || isLocationsPending) {
    return (
      <PageContainer>
        <PageHeader title="Location" back={{ to: '/locations', label: 'Locations' }} />
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
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (detailQuery.isError || !detailQuery.location) {
    return (
      <PageContainer>
        <PageHeader title="Location" back={{ to: '/locations', label: 'Locations' }} />
        <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
          <LocationNotFound onRetry={() => void detailQuery.refetch()} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LocationDetails location={detailQuery.location} locationsById={locationsById} />
      <DashboardWorkspace
        target={{ scope: 'location', locationId: detailQuery.location.id }}
        variant="section"
        title="Telemetry"
      />
      <LocationDialogs />
    </PageContainer>
  );
}

function LocationNotFound({ onRetry }: { onRetry?: () => void }) {
  const navigate = useNavigate();
  return (
    <ErrorState
      title="Location not found"
      message="We couldn't locate this space. It may have been deleted or moved to a different hierarchy."
      variant="inline"
      onRetry={onRetry}
      action={
        <Button variant="outline" size="sm" onClick={() => void navigate('/locations')} className="text-xs">
          Back to all locations
        </Button>
      }
    />
  );
}
