import { useSensorStore } from '@/pages/home/store/sensor-store';

export function useDailyAverage(key: string): number | null {
  const history = useSensorStore((s) => s.history[key]);

  if (!history || history.values.length === 0) {
    return null;
  }

  const numValues = history.values.map(Number).filter((v) => !isNaN(v));
  if (numValues.length === 0) {
    return null;
  }

  const sum = numValues.reduce((acc, val) => acc + val, 0);
  return Number((sum / numValues.length).toFixed(1));
}
