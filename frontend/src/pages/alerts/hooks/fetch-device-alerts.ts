import { fetchAlerts } from '@/pages/alerts/api/fetch-alerts';
import { useQuery } from '@tanstack/react-query';

export const useFetchAlerts = () => {
  const query = useQuery({
    queryKey: ['fetch-all-alerts'],
    queryFn: fetchAlerts,
  });

  return {
    alerts: query.data || [],
    loading: query.isLoading,
  };
};
