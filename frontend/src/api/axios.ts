import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

import { useAuthStore } from '@/store/auth-store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Custom interface to handle the unwrapped data return in TypeScript
interface ApiInstance extends AxiosInstance {
  get<T = unknown, R = T, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = unknown, R = T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = unknown, R = T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = unknown, R = T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = unknown, R = T, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

const apiInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

const api = apiInstance as ApiInstance;

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle envelope, toasting, and refresh
api.interceptors.response.use(
  (response) => {
    // If the response follows our envelope { status: 'success', data, message }
    if (response.data && response.data.status === 'success') {
      // Show success toast if a message is provided
      if (response.data.message) {
        toast.success(response.data.message);
      }
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Auto-refresh)
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Refresh endpoint also returns the envelope
        const newToken: string = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().clearAccessToken();
        if (window.location.pathname !== '/#/login') {
          window.location.replace('/#/login');
        }
        return Promise.reject(err);
      }
    }

    // Centralized error toasting: show message from backend
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api;
