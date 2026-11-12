import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createDevice, deleteDevice, rotateDeviceKey, updateDevice } from '@/app/pages/devices/shared/api';
import { deviceQueries } from '@/app/pages/devices/shared/queries';
import type { CreateDeviceInput, UpdateDeviceInput } from '@/app/pages/devices/shared/types';

/** Registers a device. The response carries the one-time device key. */
export function useCreateDevice(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateDeviceInput) => createDevice(organisationId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deviceQueries.list(organisationId).queryKey }),
  });
}

export function useUpdateDevice(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, values }: { deviceId: string; values: UpdateDeviceInput }) =>
      updateDevice(organisationId, deviceId, values),
    onSuccess: async (device) => {
      queryClient.setQueryData(deviceQueries.detail(organisationId, device.id).queryKey, device);
      await queryClient.invalidateQueries({ queryKey: deviceQueries.list(organisationId).queryKey });
    },
  });
}

export function useDeleteDevice(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => deleteDevice(organisationId, deviceId),
    onSuccess: async (_, deviceId) => {
      queryClient.removeQueries({
        queryKey: deviceQueries.detail(organisationId, deviceId).queryKey,
        exact: true,
      });
      await queryClient.invalidateQueries({ queryKey: deviceQueries.list(organisationId).queryKey });
    },
  });
}

/** Issues a new device key; the old one stops working. */
export function useRotateDeviceKey(organisationId: string) {
  return useMutation({ mutationFn: (deviceId: string) => rotateDeviceKey(organisationId, deviceId) });
}
