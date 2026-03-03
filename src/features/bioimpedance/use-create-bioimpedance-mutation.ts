import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateBioimpedanceDto } from '@/lib/api/bioimpedance-api';

export const useCreateBioimpedanceMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBioimpedanceDto) => bioimpedanceApi.create(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.bioimpedanceEvolution(created.patientId) });
    },
  });
};
