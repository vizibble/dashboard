import axios from 'axios';

import api from '@/api/axios';

/** Fetches distinct sensor parameter keys from JSONB readings for a device. */
export async function fetchDeviceParams(deviceId: string): Promise<string[]> {
  try {
    return await api.get<string[]>('/api/device/params', {
      params: { deviceId },
    });
  } catch (err: unknown) {
    let message = 'Failed to fetch device parameters.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
