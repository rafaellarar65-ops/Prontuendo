import type { AuthTokens, Consultation, Patient, UserProfile } from '@/types/api';

export interface Endpoints {
  '/auth/login': {
    post: {
      body: { email: string; password: string };
      response: AuthTokens & { user: UserProfile };
    };
  };
  '/patients': {
    get: { response: Patient[] };
  };
  '/patients/{id}': {
    get: { response: Patient };
  };
  '/consultations': {
    get: { response: Consultation[] };
    post: {
      body: { patientId: string; consultationTemplateId?: string };
      response: Consultation;
    };
  };
}
