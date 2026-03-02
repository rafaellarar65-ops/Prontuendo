import { useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';
import {
  toConsultationMutationError,
  type ConsultationMutationError,
} from '@/features/consultations/use-autosave-consultation-mutation';
import type { ConsultationRecord } from '@/lib/api/consultation-api';

export interface FinalizeConsultationInput {
  id: string;
}

type FinalizedConsultationResponse = ConsultationRecord & { finalVersion: number; hash: string };

export const useFinalizeConsultationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<FinalizedConsultationResponse, ConsultationMutationError, FinalizeConsultationInput>({
    mutationFn: async ({ id }) => {
      try {
        return await consultationApi.finalize(id);
      } catch (error) {
        throw toConsultationMutationError(error);
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.consultations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consultationById(variables.id) }),
      ]);
    },
  });
};
