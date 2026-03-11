import api from '@/api/axios';
import type { Alert } from '@/pages/alerts/types/types';

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const response = await api.get<Alert[]>('/api/alert');
    return response.data;
  } catch {
    throw new Error('Failed to fetch alerts');
  }
}
