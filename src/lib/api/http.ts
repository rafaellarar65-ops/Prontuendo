import axios from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

const resolveTenantId = (): string | null => {
  const patientTenantId = import.meta.env.VITE_PATIENT_TENANT_ID;
  const defaultTenantId = import.meta.env.VITE_DEFAULT_TENANT_ID;
  const medicalTenantId = import.meta.env.VITE_TENANT_ID;

  return patientTenantId ?? defaultTenantId ?? medicalTenantId ?? null;
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().tokens?.accessToken ??
    usePatientAuthStore.getState().tokens?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = resolveTenantId();
  if (tenantId && !config.headers['x-tenant-id']) {
    config.headers['x-tenant-id'] = tenantId;
  }

  return config;
});
