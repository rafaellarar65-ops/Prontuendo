import { http } from '@/lib/api/http';
import type { Consultation } from '@/types/api';

export interface CreateConsultationInput {
  patientId: string;
  consultationTemplateId?: string;
}

export const consultationApi = {
  async list(): Promise<Consultation[]> {
    const { data } = await http.get<Consultation[]>('/consultations');
    return data;
  },
  async create(payload: CreateConsultationInput): Promise<Consultation> {
    const { data } = await http.post<Consultation>('/consultations', payload);
    return data;
  },
};
