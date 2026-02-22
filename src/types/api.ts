export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'MEDICO' | 'ADMIN' | 'ASSISTENTE';
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate: string;
  sex: 'F' | 'M' | 'OUTRO';
  phone?: string;
  email?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  startedAt: string;
  status: 'RASCUNHO' | 'EM_ANDAMENTO' | 'FINALIZADA';
  consultationTemplateId?: string;
}

export interface ApiErrorPayload {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
}
