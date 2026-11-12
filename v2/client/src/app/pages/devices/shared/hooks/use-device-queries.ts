import { skipToken, useQuery } from '@tanstack/react-query';

import { deviceQueries } from '@/app/pages/devices/shared/queries';

export function useFetchDevices(organisationId: string) {
  const query = useQuery(deviceQueries.list(organisationId));

  return query;
}

export function useFetchDevice(organisationId: string, deviceId: string | undefined) {
  const options = deviceQueries.detail(organisationId, deviceId ?? '');

  const query = useQuery({ ...options, queryFn: deviceId ? options.queryFn : skipToken });

  return query;
}
