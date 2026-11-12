import { queryOptions } from '@tanstack/react-query';

import { getLocation, getLocations } from '@/app/pages/locations/shared/api';

/** Query definitions for locations. Keys: ['locations', organisationId, scope, ...params]. */
export const locationQueries = {
  all: (organisationId: string) => ['locations', organisationId] as const,
  list: (organisationId: string) =>
    queryOptions({
      queryKey: [...locationQueries.all(organisationId), 'list'] as const,
      queryFn: ({ signal }) => getLocations(organisationId, signal),
    }),
  detail: (organisationId: string, locationId: string) =>
    queryOptions({
      queryKey: [...locationQueries.all(organisationId), 'detail', locationId] as const,
      queryFn: ({ signal }) => getLocation(organisationId, locationId, signal),
    }),
};
