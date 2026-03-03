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
  patientId?: string;
  scoreType?: string;
  inputs?: Record<string, string | number | boolean>;
  result?: {
    scoreValue: string;
    interpretation: string;
    riskLevel: 'verde' | 'amarelo' | 'laranja' | 'vermelho';
  };
}

export interface ProtocolPayload {
  name: string;
  status?: string;
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
