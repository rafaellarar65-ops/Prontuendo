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

export interface ProtocolStep {
  title: string;
  description: string;
  order: number;
}

export interface ProtocolMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
}

export interface ProtocolPayload {
  name: string;
  description?: string;
  targetCondition?: string;
  status?: string;
  version?: string;
  inclusionCriteria?: string[];
  references?: string[];
  steps?: ProtocolStep[];
  medications?: ProtocolMedication[];
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
