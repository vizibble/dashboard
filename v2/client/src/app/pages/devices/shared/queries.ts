import { queryOptions } from '@tanstack/react-query';

import { getDevice, getDevices } from '@/app/pages/devices/shared/api';

/** Query definitions for devices. Keys: ['devices', organisationId, scope, ...params]. */
export const deviceQueries = {
  all: (organisationId: string) => ['devices', organisationId] as const,
  list: (organisationId: string) =>
    queryOptions({
      queryKey: [...deviceQueries.all(organisationId), 'list'] as const,
      queryFn: ({ signal }) => getDevices(organisationId, signal),
    }),
  detail: (organisationId: string, deviceId: string) =>
    queryOptions({
      queryKey: [...deviceQueries.all(organisationId), 'detail', deviceId] as const,
      queryFn: ({ signal }) => getDevice(organisationId, deviceId, signal),
    }),
};
