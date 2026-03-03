import { http } from '@/lib/api/http';

export type PrescriptionStatus = 'ATIVA' | 'VENCIDA' | 'CANCELADA';

export interface PrescriptionMedication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  status: PrescriptionStatus;
  medications: PrescriptionMedication[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionDto {
  patientId: string;
  date: string;
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
  }>;
  notes?: string;
}

export const prescriptionApi = {
  async listActive(patientId: string): Promise<Prescription[]> {
    const { data } = await http.get<Prescription[]>('/prescriptions/active', {
      params: { patientId },
    });
    return data;
  },

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    const { data } = await http.post<Prescription>('/prescriptions', dto);
    return data;
  },

  async renew(prescriptionId: string): Promise<Prescription> {
    const { data } = await http.post<Prescription>(`/prescriptions/${prescriptionId}/renew`);
    return data;
  },
};
