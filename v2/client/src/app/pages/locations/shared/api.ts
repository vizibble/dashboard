import { locationSchema } from '@vizibble/shared/locations';
import { buildPath, routes } from '@vizibble/shared/routes';

import type { LocationFormValues, LocationRenameValues } from '@/app/pages/locations/shared/types';
import { api } from '@/app/shared/utils/api-request';

export function getLocations(organisationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.locations.collection, { organisationId }), locationSchema.array(), { signal });
}

export function getLocation(organisationId: string, locationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.locations.item, { organisationId, locationId }), locationSchema, { signal });
}

export function createLocation(organisationId: string, values: LocationFormValues) {
  return api.post(buildPath(routes.locations.collection, { organisationId }), values, locationSchema);
}

export function updateLocation(organisationId: string, locationId: string, values: LocationRenameValues) {
  return api.patch(buildPath(routes.locations.item, { organisationId, locationId }), values, locationSchema);
}

export function deleteLocation(organisationId: string, locationId: string) {
  return api.delete(buildPath(routes.locations.item, { organisationId, locationId }));
}
