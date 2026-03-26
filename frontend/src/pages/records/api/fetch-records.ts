import axios from 'axios';

import api from '@/api/axios';

export interface RecordPoint {
  payload: Record<string, number>;
  recorded_at: string;
}

export async function fetchRecords(
  deviceId: string,
  date: string,
  timezone: string,
  resolution: 'hour' | 'minute' = 'hour'
): Promise<{ rows: RecordPoint[] }> {
  try {
    return await api.get('/api/device/records', {
      params: { deviceId, date, timezone, resolution },
    });
  } catch (err: unknown) {
    let message = 'Failed to fetch records.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
