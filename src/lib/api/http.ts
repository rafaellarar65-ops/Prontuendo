import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorPayload } from '@/types/api';
import { useAuthStore } from '@/lib/stores/auth-store';

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const resolveApiBaseUrl = (): string => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (import.meta.env.DEV) {
    return DEFAULT_API_BASE_URL;
  }

  throw new Error('Missing required env var: VITE_API_BASE_URL');
};

const API_BASE_URL = resolveApiBaseUrl();

const attachAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use(attachAuthHeader);

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  },
);
