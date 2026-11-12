import { skipToken, useQuery } from '@tanstack/react-query';

import { locationQueries } from '@/app/pages/locations/shared/queries';

export function useFetchLocations(organisationId: string) {
  const query = useQuery(locationQueries.list(organisationId));

  return query;
}

export function useFetchLocation(organisationId: string, locationId: string | undefined) {
  const options = locationQueries.detail(organisationId, locationId ?? '');

  const query = useQuery({ ...options, queryFn: locationId ? options.queryFn : skipToken });

  return query;
}
