import axios from 'axios';

import api from '@/api/axios';
import { useAuthStore } from '@/store/auth-store';

export interface LoginFormData {
  email: string;
  password: string;
}

export async function loginRequest(data: LoginFormData) {
  try {
    const res = await api.post('/api/auth/login', data);
    const { accessToken } = res.data as { accessToken: string };
    useAuthStore.getState().setAccessToken(accessToken);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.error ?? 'Login failed');
    }
    throw new Error('An unexpected error occurred.');
  }
}
