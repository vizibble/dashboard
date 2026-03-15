import api from '@/api/axios';

export async function fetchAvailableDates(
  deviceId: string,
  timezone?: string
): Promise<{ dates: string[] }> {
  try {
    const res = await api.get('/api/device/records/dates', {
      params: { deviceId, timezone },
    });
    return res.data;
  } catch {
    throw new Error('Failed to fetch available dates.');
  }
}
