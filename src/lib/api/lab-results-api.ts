import { http } from '@/lib/api/http';
import type { CreateLabResultDto, LabResult } from '@/types/clinical-modules';

export const labResultsApi = {
  async history(patientId: string, examName?: string): Promise<LabResult[]> {
    const { data } = await http.get<LabResult[]>(`/lab-results/${patientId}/history`, {
      params: examName ? { examName } : undefined,
    });
    return data;
  },
  async create(dto: CreateLabResultDto): Promise<LabResult> {
    const { data } = await http.post<LabResult>('/lab-results', dto);
    return data;
  },
};
