import axios from 'axios';

import api from '@/api/axios';

export async function fetchAvailableDates(
  deviceId: string,
  timezone?: string
): Promise<{ dates: string[] }> {
  try {
    return await api.get('/api/device/records/dates', {
      params: { deviceId, timezone },
    });
  } catch (err: unknown) {
    let message = 'Failed to fetch available dates.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
