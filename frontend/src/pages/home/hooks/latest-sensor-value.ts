import { useSensorStore } from '@/pages/home/store/sensor-store';

export function useDailyAverage(key: string): number | null {
  const history = useSensorStore((s) => s.history[key]);

  if (!history || history.values.length === 0) {
    return null;
  }

  const sum = history.values.reduce((acc, val) => acc + val, 0);
  return Number((sum / history.values.length).toFixed(1));
}
