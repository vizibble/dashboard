import axios from 'axios';

import api from '@/api/axios';

interface HistoryPoint {
  payload: Record<string, number>;
  recorded_at: string;
}

export async function fetchHistory(
  deviceId: string
): Promise<{ rows: HistoryPoint[]; mode: string }> {
  try {
    return await api.get('/api/device/history', {
      params: { deviceId },
    });
  } catch (err: unknown) {
    let message = 'Failed to fetch history.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
