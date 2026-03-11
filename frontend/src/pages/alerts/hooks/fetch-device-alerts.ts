import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "@/pages/alerts/api/fetch-alerts";

export const useFetchAlerts = () => {
  const query = useQuery({
    queryKey: ["fetch-all-alerts"],
    queryFn: fetchAlerts,
  });

  return {
    alerts: query.data || [],
    loading: query.isLoading,
  };
};
