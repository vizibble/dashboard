import { useSensorStore } from '@/pages/home/store/sensor-store';

/**
 * Returns the latest live value for a given sensor field key.
 * Returns null if no data has arrived yet.
 */
export function useSensorField(key: string): number | null {
  return useSensorStore((s) => s.sensorValues[key] ?? null);
}
