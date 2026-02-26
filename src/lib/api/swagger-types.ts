import type { AuthTokens, Consultation, Patient, UserProfile } from '@/types/api';

export interface Endpoints {
  '/auth/login': {
    post: {
      body: { email: string; password: string };
      response: AuthTokens & { user: UserProfile };
    };
  };
  '/agenda': {
    get: { response: unknown[] };
    post: {
      body: { payload: Record<string, unknown> };
      response: unknown;
    };
  };
  '/agenda/{id}': {
    patch: {
      body: { payload: Record<string, unknown> };
      response: unknown;
    };
    delete: { response: { deleted: boolean } };
  };
  '/patients': {
    get: { response: Patient[] };
    post: {
      body: Partial<Patient> & { fullName: string };
      response: Patient;
    };
  };
  '/patients/{id}': {
    get: { response: Patient | null };
    patch: {
      body: Partial<Patient>;
      response: Patient;
    };
    delete: { response: { deleted: boolean } };
  };
  '/consultations': {
    get: { response: Consultation[] };
    post: {
      body: { patientId: string; consultationTemplateId?: string };
      response: Consultation;
    };
  };
}
