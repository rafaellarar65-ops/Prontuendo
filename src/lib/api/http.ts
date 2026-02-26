import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorPayload } from '@/types/api';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const resolveTenantId = (): string | undefined => {
  const tenantFromEnv = import.meta.env.VITE_TENANT_ID;

  if (typeof window === 'undefined') {
    return tenantFromEnv;
  }

  const tenantFromStorage = window.localStorage.getItem('prontuendo-tenant-id') ?? undefined;
  return tenantFromStorage ?? tenantFromEnv;
};

const attachAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().tokens?.accessToken;
  const tenantId = resolveTenantId();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  if (tenantId) {
    config.headers.set('x-tenant-id', tenantId);
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
