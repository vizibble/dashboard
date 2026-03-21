import axios from 'axios';

import api from '@/api/axios';
import { useAuthStore } from '@/store/auth-store';

export interface LoginFormData {
  email: string;
  password: string;
}

export async function loginRequest(data: LoginFormData) {
  try {
    const res = await api.post<{ accessToken: string }>('/api/auth/login', data);
    useAuthStore.getState().setAccessToken(res.accessToken);
    return res;
  } catch (err: unknown) {
    let message = 'Login failed';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
