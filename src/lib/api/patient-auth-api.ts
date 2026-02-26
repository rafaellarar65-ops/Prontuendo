import { http } from '@/lib/api/http';
import type { AuthTokens } from '@/types/api';

interface PatientLoginPayload {
  email: string;
  password: string;
}

interface PatientUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  roles: string[];
  patientId?: string;
}

interface PatientLoginResponse extends AuthTokens {
  user: PatientUser;
}

export const patientAuthApi = {
  async login(payload: PatientLoginPayload): Promise<PatientLoginResponse> {
    const { data } = await http.post<PatientLoginResponse>('/auth/patient-login', payload, {
      headers: {
        'x-tenant-id': import.meta.env.VITE_PATIENT_TENANT_ID ?? import.meta.env.VITE_DEFAULT_TENANT_ID ?? 'demo-clinic',
      },
    });

    return data;
  },
};
