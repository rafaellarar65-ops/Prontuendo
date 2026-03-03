import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scoresApi, type ClinicalScoreInput, type ClinicalScoreResult, type ScoreType } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';

interface CalculateScoreVariables {
  patientId: string;
  scoreType: ScoreType;
  inputs: ClinicalScoreInput;
}

export const useCalculateScoreMutation = () => {
  const qc = useQueryClient();

  return useMutation<ClinicalScoreResult, Error, CalculateScoreVariables>({
    mutationFn: (variables) => scoresApi.calculate(variables.patientId, variables.scoreType, variables.inputs),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: queryKeys.scoresHistory(variables.patientId, variables.scoreType) });
      void qc.invalidateQueries({ queryKey: queryKeys.scoresLatest(variables.patientId) });
    },
  });
};
