import { labApi } from '@/lib/api/lab-api';
import type { CreateLabResultDto } from '@/types/clinical-modules';

export const labResultsApi = {
  async history(patientId: string, examName?: string) {
    const results = await labApi.list(patientId);
    if (!examName) {
      return results;
    }

    return results.filter((result) => result.examName === examName);
  },

  async create(dto: CreateLabResultDto) {
    return labApi.create(dto);
  },
};
