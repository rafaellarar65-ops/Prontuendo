import { http } from '@/lib/api/http';

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

export const labApi = {
  async list(patientId: string): Promise<LabResult[]> {
    const { data } = await http.get<LabResult[]>('/lab-results', {
      params: { patientId },
    });
    return data;
  },

  async create(dto: Omit<LabResult, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<LabResult> {
    const { data } = await http.post<LabResult>('/lab-results', dto);
    return data;
  },
};
