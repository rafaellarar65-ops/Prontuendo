import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scoresApi } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { ScorePayload } from '@/types/clinical-modules';

export const useCreateScoreMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScorePayload) => scoresApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.scores });
    },
  });
};

export const useUpdateScoreMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ScorePayload> }) => scoresApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.scores });
    },
  });
};
