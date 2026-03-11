import api from '@/api/axios';

/** Fetches distinct sensor parameter keys from JSONB readings for a device. */
export async function fetchDeviceParams(deviceId: string): Promise<string[]> {
  const res = await api.get<string[]>('/api/device/params', {
    params: { deviceId },
  });
  return res.data;
}
