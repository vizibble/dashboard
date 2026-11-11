import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDevice,
  deleteDevice,
  getDevice,
  getDevices,
  rotateDeviceKey,
  updateDevice,
} from '@/app/pages/devices/shared/api';
import type { CreateDeviceInput, UpdateDeviceInput } from '@/app/pages/devices/shared/types';

// Cache keys for device queries.
export const deviceQueryKeys = {
  all: ['devices'] as const,
  list: (organisationId: string) => ['devices', 'list', organisationId] as const,
  detail: (organisationId: string, deviceId: string) => ['devices', 'detail', organisationId, deviceId] as const,
};

// Fetch all devices belonging to an organisation.
export function useFetchDevices(organisationId: string) {
  const query = useQuery({
    queryKey: deviceQueryKeys.list(organisationId),
    queryFn: ({ signal }) => getDevices(organisationId, signal),
  });
  return { ...query, devices: query.data ?? [] };
}

// Fetch one device.
export function useFetchDevice(organisationId: string, deviceId: string | undefined) {
  const query = useQuery({
    queryKey: deviceQueryKeys.detail(organisationId, deviceId ?? ''),
    queryFn: ({ signal }) => getDevice(organisationId, deviceId!, signal),
    enabled: Boolean(deviceId),
  });
  return { ...query, device: query.data };
}

// Register a device. The response carries the one-time device key.
export function useCreateDevice(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CreateDeviceInput) => createDevice(organisationId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isCreating: mutation.isPending };
}

// Update a device (name, location or template version).
export function useUpdateDevice(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ deviceId, values }: { deviceId: string; values: UpdateDeviceInput }) =>
      updateDevice(organisationId, deviceId, values),
    onSuccess: async (device) => {
      queryClient.setQueryData(deviceQueryKeys.detail(organisationId, device.id), device);
      await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isUpdating: mutation.isPending };
}

// Delete a device.
export function useDeleteDevice(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (deviceId: string) => deleteDevice(organisationId, deviceId),
    onSuccess: async (_, deviceId) => {
      queryClient.removeQueries({ queryKey: deviceQueryKeys.detail(organisationId, deviceId), exact: true });
      await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isDeleting: mutation.isPending };
}

// Issue a new device key; the old one stops working.
export function useRotateDeviceKey(organisationId: string) {
  const mutation = useMutation({
    mutationFn: (deviceId: string) => rotateDeviceKey(organisationId, deviceId),
  });
  return { ...mutation, isRotating: mutation.isPending };
}
