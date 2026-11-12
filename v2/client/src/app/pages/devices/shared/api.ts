import { deviceSchema, deviceWithKeySchema } from '@vizibble/shared/devices';
import { buildPath, routes } from '@vizibble/shared/routes';

import type { CreateDeviceInput, UpdateDeviceInput } from '@/app/pages/devices/shared/types';
import { api } from '@/app/shared/utils/api-request';

export function getDevices(organisationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.devices.collection, { organisationId }), deviceSchema.array(), { signal });
}

export function getDevice(organisationId: string, deviceId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.devices.item, { organisationId, deviceId }), deviceSchema, { signal });
}

export function createDevice(organisationId: string, values: CreateDeviceInput) {
  return api.post(buildPath(routes.devices.collection, { organisationId }), values, deviceWithKeySchema);
}

export function updateDevice(organisationId: string, deviceId: string, values: UpdateDeviceInput) {
  return api.patch(buildPath(routes.devices.item, { organisationId, deviceId }), values, deviceSchema);
}

export function deleteDevice(organisationId: string, deviceId: string) {
  return api.delete(buildPath(routes.devices.item, { organisationId, deviceId }));
}

export function rotateDeviceKey(organisationId: string, deviceId: string) {
  return api.post(
    buildPath(routes.devices.rotateKey, { organisationId, deviceId }),
    undefined,
    deviceWithKeySchema,
  );
}
