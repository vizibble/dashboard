import { fetchRecords } from '@/pages/records/api/fetch-records';
import { useQuery } from '@tanstack/react-query';

export function useDeviceRecords(deviceId: string | null, date: string | null) {
  const query = useQuery({
    queryKey: ['device-records', deviceId, date],
    queryFn: () =>
      fetchRecords(
        deviceId!,
        date!,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ),
    enabled: !!deviceId && !!date,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
  };
}
