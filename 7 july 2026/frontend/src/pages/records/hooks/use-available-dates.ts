import { fetchAvailableDates } from '@/pages/records/api/fetch-available-dates';
import { useQuery } from '@tanstack/react-query';

export function useAvailableDates(deviceId: string | null) {
  const query = useQuery({
    queryKey: ['available-dates', deviceId],
    queryFn: () =>
      fetchAvailableDates(
        deviceId!,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ),
    enabled: !!deviceId,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    dates: query.data?.dates ?? [],
  };
}
