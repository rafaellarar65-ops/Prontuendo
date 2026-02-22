import { useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useCreateConsultationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: consultationApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consultations });
    },
  });
};
