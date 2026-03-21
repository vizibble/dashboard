import axios from 'axios';

import api from '@/api/axios';
import type { UserSettings } from '@/pages/settings/types/types';

export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    return await api.get<UserSettings>('/api/user/settings');
  } catch (err: unknown) {
    let message = 'Failed to fetch settings.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}

export async function updateUserSettings(
  settings: UserSettings
): Promise<void> {
  try {
    await api.put('/api/user/settings', settings);
  } catch (err: unknown) {
    let message = 'Failed to update settings.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
