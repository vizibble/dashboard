import api from '@/api/axios';
import type { UserSettings } from '@/pages/settings/types/types';

export async function fetchUserSettings(): Promise<UserSettings> {
  const res = await api.get('/api/user/settings');
  return res.data;
}

export async function updateUserSettings(
  settings: UserSettings
): Promise<void> {
  await api.post('/api/user/settings', settings);
}
