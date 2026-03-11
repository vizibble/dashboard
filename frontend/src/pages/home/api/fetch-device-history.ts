import api from '@/api/axios';

interface HistoryPoint {
  payload: Record<string, number>;
  recorded_at: string;
}

export async function fetchHistory(deviceId: string): Promise<HistoryPoint[]> {
  try {
    const res = await api.get("/api/device/history", { params: { deviceId } });
    return res.data;
  } catch {
    throw new Error("Failed to fetch history.");
  }
}
