import { useEffect } from 'react';

import { fetchHistory } from '@/pages/home/api/fetch-device-history';
import { useSensorStore } from '@/pages/home/store/sensor-store';
import { useQuery } from '@tanstack/react-query';

export function useDeviceHistory() {
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const loadHistory = useSensorStore((s) => s.loadHistory);

  const query = useQuery({
    queryKey: ['device-history', selectedDeviceId],
    queryFn: () => fetchHistory(selectedDeviceId!),
    enabled: !!selectedDeviceId,
  });

  useEffect(() => {
    if (query.data) {
      loadHistory(query.data as Parameters<typeof loadHistory>[0]);
    }
  }, [query.data, loadHistory]);

  return { isLoading: query.isLoading, isError: query.isError, query };
}
