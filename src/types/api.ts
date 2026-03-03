export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'MEDICO' | 'ADMIN' | 'ASSISTENTE' | 'RECEPCAO';
  roles?: string[];
  specialty?: string;
  tenantId?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate?: string;
  sex?: 'F' | 'M' | 'OUTRO' | 'NI';
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  lifecycle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientDto {
  fullName: string;
  birthDate?: string;
  sex?: 'F' | 'M' | 'OUTRO' | 'NI';
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

export type UpdatePatientDto = Partial<CreatePatientDto>;

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId?: string;
  patientName?: string;
  scheduledAt: string;
  date?: string;
  time?: string;
  durationMin?: number;
  type:
    | 'PRIMEIRA_CONSULTA'
    | 'RETORNO'
    | 'TELECONSULTA'
    | 'EXAME'
    | 'INITIAL_CONSULTATION'
    | 'FOLLOW_UP'
    | 'TELECONSULTATION'
    | 'EXAM';
  status:
    | 'AGENDADO'
    | 'CONFIRMADO'
    | 'EM_ANDAMENTO'
    | 'CONCLUIDO'
    | 'CANCELADO'
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELED';
  notes?: string;
  returnFromConsultationId?: string | null;
}

export interface CreateAppointmentDto {
  patientId: string;
  clinicianId: string;
  scheduledAt: string;
  durationMin: number;
  type: Appointment['type'];
  notes?: string;
  returnFromConsultationId?: string;
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
