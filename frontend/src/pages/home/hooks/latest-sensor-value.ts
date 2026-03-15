import { useSensorStore } from '@/pages/home/store/sensor-store';

export function useSensorField(key: string): number | null {
  const mode = useSensorStore((s) => s.mode);
  const liveValue = useSensorStore((s) => s.sensorValues[key] ?? null);
  const history = useSensorStore((s) => s.history[key]);

  if (mode === 'instant') {
    return liveValue;
  }

  if (history && history.values.length > 0) {
    return history.values[history.values.length - 1];
  }

  return liveValue;
}
