import { fetchRecords } from '@/pages/records/api/fetch-records';
import { useQuery } from '@tanstack/react-query';

export function useDeviceRecords(
  deviceId: string | null,
  date: string | null,
  resolution: 'hour' | 'minute' = 'hour'
) {
  const query = useQuery({
    queryKey: ['device-records', deviceId, date, resolution],
    queryFn: () =>
      fetchRecords(
        deviceId!,
        date!,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        resolution
      ),
    enabled: !!deviceId && !!date,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
  };
}
