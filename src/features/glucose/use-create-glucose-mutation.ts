import { useMutation, useQueryClient } from '@tanstack/react-query';
import { glucoseApi } from '@/lib/api/glucose-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateGlucoseMeasurementDto } from '@/lib/api/glucose-api';

export const useCreateGlucoseMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateGlucoseMeasurementDto) => glucoseApi.create(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.glucoseHistory(created.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.glucoseAnalysis(created.patientId) });
    },
  });
};
