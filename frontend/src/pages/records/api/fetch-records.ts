import api from '@/api/axios';

export interface RecordPoint {
  payload: Record<string, number>;
  recorded_at: string;
}

export async function fetchRecords(
  deviceId: string,
  date: string,
  timezone?: string
): Promise<{ rows: RecordPoint[] }> {
  try {
    const res = await api.get('/api/device/records', {
      params: { deviceId, date, timezone },
    });
    return res.data;
  } catch {
    throw new Error('Failed to fetch records.');
  }
}
