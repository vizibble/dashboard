import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from '@/app/pages/locations/shared/api';

import type { LocationFormValues, LocationRenameValues } from '@/app/pages/locations/shared/types';

// Cache keys for location queries.
export const locationQueryKeys = {
  all: ['locations'] as const,
  list: (organisationId: string) => ['locations', 'list', organisationId] as const,
  detail: (organisationId: string, locationId: string) => ['locations', 'detail', organisationId, locationId] as const,
};

// Fetch all locations belonging to an organisation.
export function useFetchLocations(organisationId: string) {
  const query = useQuery({
    queryKey: locationQueryKeys.list(organisationId),
    queryFn: ({ signal }) => getLocations(organisationId, signal),
  });
  return { ...query, locations: query.data ?? [] };
}

// Fetch one location.
export function useFetchLocation(organisationId: string, locationId: string | undefined) {
  const query = useQuery({
    queryKey: locationQueryKeys.detail(organisationId, locationId ?? ''),
    queryFn: ({ signal }) => getLocation(organisationId, locationId!, signal),
    enabled: Boolean(locationId),
  });
  return { ...query, location: query.data };
}

// Create a location.
export function useCreateLocation(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: LocationFormValues) => createLocation(organisationId, values),
    onSuccess: async (location) => {
      queryClient.setQueryData(locationQueryKeys.detail(organisationId, location.id), location);
      await queryClient.invalidateQueries({
        queryKey: locationQueryKeys.list(organisationId),
      });
    },
  });
  return { ...mutation, isCreating: mutation.isPending };
}

// Rename a location.
export function useRenameLocation(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ locationId, values }: { locationId: string; values: LocationRenameValues }) =>
      updateLocation(organisationId, locationId, values),
    onSuccess: async (location) => {
      queryClient.setQueryData(locationQueryKeys.detail(organisationId, location.id), location);
      await queryClient.invalidateQueries({
        queryKey: locationQueryKeys.list(organisationId),
      });
    },
  });
  return { ...mutation, isRenaming: mutation.isPending };
}

// Delete a location.
export function useDeleteLocation(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (locationId: string) => deleteLocation(organisationId, locationId),
    onSuccess: async (_, locationId) => {
      queryClient.removeQueries({
        queryKey: locationQueryKeys.detail(organisationId, locationId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: locationQueryKeys.list(organisationId),
      });
    },
  });
  return { ...mutation, isDeleting: mutation.isPending };
}
