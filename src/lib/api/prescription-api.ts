import { http } from '@/lib/api/http';

export type PrescriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';

export interface Prescription {
  id: string;
  tenantId: string;
  patientId: string;
  consultationId?: string | null;
  drugName: string;
  dosage?: string | null;
  instructions?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DrugTemplate {
  id: string;
  name: string;
  dosage?: string | null;
  instructions?: string | null;
}

export interface CreatePrescriptionDto {
  patientId: string;
  consultationId?: string;
  drugName: string;
  dosage?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
}

export interface CancelPrescriptionDto {
  reason?: string;
}

export interface RenewPrescriptionDto {
  endDate?: string;
  dosage?: string;
  instructions?: string;
}

export const prescriptionApi = {
  async listByPatient(patientId: string): Promise<Prescription[]> {
    const { data } = await http.get<Prescription[]>('/prescriptions', {
      params: { patientId },
    });
    return data;
  },

  async listActive(patientId: string): Promise<Prescription[]> {
    const { data } = await http.get<Prescription[]>('/prescriptions/active', {
      params: { patientId },
    });
    return data;
  },

  async listByConsultation(consultationId: string): Promise<Prescription[]> {
    const { data } = await http.get<Prescription[]>('/prescriptions', {
      params: { consultationId },
    });
    return data;
  },

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    const { data } = await http.post<Prescription>('/prescriptions', dto);
    return data;
  },

  async cancel(id: string, dto?: CancelPrescriptionDto): Promise<Prescription> {
    const { data } = await http.post<Prescription>(`/prescriptions/${id}/cancel`, dto);
    return data;
  },

  async renew(id: string, dto?: RenewPrescriptionDto): Promise<Prescription> {
    const { data } = await http.post<Prescription>(`/prescriptions/${id}/renew`, dto);
    return data;
  },

  async listDrugTemplates(): Promise<DrugTemplate[]> {
    const { data } = await http.get<DrugTemplate[]>('/prescriptions/drug-templates');
    return data;
  },
};
