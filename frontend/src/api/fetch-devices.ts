import axios from 'axios';

import api from '@/api/axios';
import type { Device } from '@/pages/home/types/types';

export async function fetchDevices(): Promise<Device[]> {
  try {
    return await api.get<Device[]>('/api/device');
  } catch (err: unknown) {
    let message = 'Failed to load devices.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
