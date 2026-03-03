import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateBioimpedanceDto } from '@/types/bioimpedance';

export const useCreateBioimpedanceMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, dto }: { patientId: string; dto: CreateBioimpedanceDto }) =>
      bioimpedanceApi.create(patientId, dto),
    onSuccess: (_, { patientId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.bioimpedanceEvolution(patientId) });
    },
  });
};
