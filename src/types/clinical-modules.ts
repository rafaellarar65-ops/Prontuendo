export interface ModuleRecord<TPayload> {
  id: string;
  tenantId: string;
  payload: TPayload;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicPayload {
  name: string;
  city: string;
}

export interface ScorePayload {
  label: string;
  value: string;
}

export type ProtocolStatus = 'ATIVO' | 'INATIVO' | 'RASCUNHO';

export interface ProtocolPayload {
  name: string;
  description?: string;
  targetCondition?: string;
  version?: number;
  status?: ProtocolStatus;
  steps?: unknown;
  medications?: unknown;
  inclusionCriteria?: unknown;
  references?: string | null;
}

export interface LabResult {
  id: string;
  tenantId: string;
  patientId: string;
  examName: string;
  value: number;
  unit?: string | null;
  reference?: string | null;
  resultDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabResultDto {
  patientId: string;
  examName: string;
  value: number;
  unit?: string;
  reference?: string;
  resultDate: string;
}
