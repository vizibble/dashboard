import { fetchDeviceParams } from '@/pages/alerts/api/device-params';
import { useQuery } from '@tanstack/react-query';

export const useFetchDeviceParams = (deviceId: string | null) => {
  const query = useQuery({
    queryKey: ['device-params', deviceId],
    queryFn: () => fetchDeviceParams(deviceId!),
    enabled: !!deviceId,
    staleTime: 60_000, // parameters don't change often — cache for 1 min
  });
  return {
    params: query.data ?? [],
    loading: query.isLoading,
  };
};
