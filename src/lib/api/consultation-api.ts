import { http } from '@/lib/api/http';

export interface CreateConsultationInput {
  patientId: string;
}

export interface ConsultationDraft {
  subjetivo?: string;
  objetivo?: string;
  avaliacao?: string;
  plano?: string;
  [key: string]: unknown;
}export interface ConsultationRecord {
  id: string;
  tenantId: string;
  patientId: string;
  clinicianId: string;
  status: 'DRAFT' | 'FINALIZED';
  latestDraft: ConsultationDraft | null;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  patient?: { id: string; fullName: string };
}

export const consultationApi = {
  async list(patientId?: string): Promise<ConsultationRecord[]> {
    const params = patientId ? { patientId } : {};
    const { data } = await http.get<ConsultationRecord[]>('/consultations', { params });
    return data;
  },
  async create(payload: CreateConsultationInput): Promise<ConsultationRecord> {
    const { data } = await http.post<ConsultationRecord>('/consultations', payload);
    return data;
  },
  async autosave(id: string, draft: ConsultationDraft): Promise<ConsultationRecord> {
    // Mapeia campos SOAP frontend → DTO do backend (objetos com text)
    const payload: Record<string, { text: string } | undefined> = {};
    if (draft.subjetivo !== undefined) payload.anamnese = { text: draft.subjetivo };
    if (draft.objetivo !== undefined) payload.exameFisico = { text: draft.objetivo };
    if (draft.avaliacao !== undefined) payload.diagnostico = { text: draft.avaliacao };
    if (draft.plano !== undefined) payload.prescricao = { text: draft.plano };
    const { data } = await http.patch<ConsultationRecord>(`/consultations/${id}/autosave`, payload);
    return data;
  },
  async finalize(id: string): Promise<ConsultationRecord & { finalVersion: number; hash: string }> {
    const { data } = await http.post<ConsultationRecord & { finalVersion: number; hash: string }>(
      `/consultations/${id}/finalize`,
    );
    return data;
  },
};
