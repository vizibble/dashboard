import { fetchDevices } from '@/api/fetch-devices';
import { useQuery } from '@tanstack/react-query';

export const useFetchDevices = () => {
  const query = useQuery({
    queryKey: ['fetch-all-devices'],
    queryFn: fetchDevices,
  });

  return {
    devices: query.data || [],
    loading: query.isLoading,
  };
};
