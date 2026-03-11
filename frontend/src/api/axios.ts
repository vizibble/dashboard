import axios from 'axios';

import { useAuthStore } from '@/store/auth-store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

// Request interceptor: attach access token from auth store
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest || originalRequest._retry)
      return Promise.reject(error);

    if (error.response?.status === 401) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken: string = res.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAccessToken();
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
