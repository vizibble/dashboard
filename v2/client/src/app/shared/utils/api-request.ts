import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { z } from 'zod';

import { API_BASE_URL } from '@/app/shared/utils/config';

type DataResponse<T> = {
  data: T;
};

type ApiRequestConfig = AxiosRequestConfig;

type ApiClientErrorOptions = {
  status?: number;
  code?: string;
};

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  constructor(message: string, options: ApiClientErrorOptions = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }
  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/api/v2`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Sends a request and unwraps `{ data }`. When a shared response schema is given, the payload
 * is validated against it, so a server that drifts from the contract fails loudly here
 * instead of leaking malformed data into the UI.
 */
export async function apiRequest<T>(config: ApiRequestConfig, schema?: z.ZodType<T>): Promise<T> {
  let response: AxiosResponse<unknown>;
  try {
    response = await apiClient.request<unknown>(config);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response
        ? getErrorMessage(error.response.data, `Request failed with status ${status}.`)
        : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'The request timed out.'
          : 'Unable to reach the server. Check your connection and try again.';
      throw new ApiClientError(message, { status, code: error.code });
    }
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  if (!isRecord(response.data) || !('data' in response.data)) {
    throw new ApiClientError('The server returned an invalid response.', { status: response.status });
  }
  const data = (response.data as DataResponse<unknown>).data;
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Response from ${config.method} ${config.url} violates the API contract`, result.error.issues);
    throw new ApiClientError('The server returned an unexpected response.', {
      status: response.status,
      code: 'CONTRACT_VIOLATION',
    });
  }
  return result.data;
}

type RequestOptions = Omit<ApiRequestConfig, 'url' | 'method' | 'data'>;

/** Every call names the shared response schema it expects; `delete` expects 204 No Content. */
export const api = {
  get<T>(path: string, schema: z.ZodType<T>, config?: RequestOptions) {
    return apiRequest({ ...config, url: path, method: 'GET' }, schema);
  },
  post<T>(path: string, data: unknown, schema: z.ZodType<T>, config?: RequestOptions) {
    return apiRequest({ ...config, url: path, method: 'POST', data }, schema);
  },
  put<T>(path: string, data: unknown, schema: z.ZodType<T>, config?: RequestOptions) {
    return apiRequest({ ...config, url: path, method: 'PUT', data }, schema);
  },
  patch<T>(path: string, data: unknown, schema: z.ZodType<T>, config?: RequestOptions) {
    return apiRequest({ ...config, url: path, method: 'PATCH', data }, schema);
  },
  delete(path: string, config?: RequestOptions) {
    return apiRequest<void>({ ...config, url: path, method: 'DELETE' });
  },
};
