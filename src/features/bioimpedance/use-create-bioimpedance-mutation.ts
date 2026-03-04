import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bioimpedanceApi,
  type CreateBioimpedanceDto,
} from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useCreateBioimpedanceMutation = (patientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBioimpedanceDto) => bioimpedanceApi.create(patientId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bioimpedanceEvolution(patientId),
      });
    },
  });
};
