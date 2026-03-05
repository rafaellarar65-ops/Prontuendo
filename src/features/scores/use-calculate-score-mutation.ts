import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scoresApi, type ClinicalScoreInput, type ClinicalScoreResult, type ScoreName, type ScoreType } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';

interface CalculateScoreVariables {
  patientId: string;
  scoreType: ScoreType;
  scoreName?: ScoreName;
  inputs: ClinicalScoreInput;
}

export const useCalculateScoreMutation = () => {
  const qc = useQueryClient();

  return useMutation<ClinicalScoreResult, Error, CalculateScoreVariables>({
    mutationFn: ({ patientId, scoreType, inputs }) => scoresApi.calculate(patientId, scoreType, inputs),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: queryKeys.scoresHistory(variables.patientId, variables.scoreName) });
      void qc.invalidateQueries({ queryKey: queryKeys.scoresLatest(variables.patientId, variables.scoreName) });
    },
  });
};
