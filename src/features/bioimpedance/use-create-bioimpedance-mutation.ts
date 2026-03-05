import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateBioimpedancePayload } from '@/types/bioimpedance';

export const useCreateBioimpedanceMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBioimpedancePayload) => bioimpedanceApi.create(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.bioimpedanceEvolution(created.patientId) });
    },
  });
};
