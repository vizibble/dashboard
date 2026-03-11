import axios from 'axios';

import api from '@/api/axios';
import type { Device } from '@/pages/home/types/types';

export async function fetchDevices(): Promise<Device[]> {
  try {
    const res = await api.get("/api/device");
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      window.location.href = "/#/login";
      return [];
    }
    throw new Error("Failed to load devices.");
  }
}
