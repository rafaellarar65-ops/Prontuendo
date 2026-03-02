import { useMutation, useQueryClient } from '@tanstack/react-query';
import { labApi } from '@/lib/api/lab-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateLabResultDto } from '@/types/clinical-modules';

export const useCreateLabResultMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLabResultDto) => labApi.create(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.labResultsHistory(created.patientId) });
    },
  });
};
