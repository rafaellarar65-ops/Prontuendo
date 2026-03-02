import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api/http';
import { queryKeys } from '@/lib/query/query-keys';
import type { GlucoseRecord } from '@/features/glucose/use-glucose-query';

export interface CreateGlucoseDto {
  patientId: string;
  value: number;
  measuredAt: string;
  notes?: string;
}

export const useCreateGlucoseMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateGlucoseDto) => {
      const { data } = await http.post<GlucoseRecord>('/glucose', dto);
      return data;
    },
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.glucose(created.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.labResults(created.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.analysis(created.patientId) });
    },
  });
};
