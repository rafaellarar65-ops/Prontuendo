import { useQuery } from '@tanstack/react-query';
import { scoresApi, type ScoreName } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useScoreHistoryQuery = (patientId?: string, scoreName?: ScoreName) =>
  useQuery({
    queryKey: queryKeys.scoresHistory(patientId ?? 'empty', scoreName),
    queryFn: () => scoresApi.history(patientId!, scoreName),
    enabled: Boolean(patientId),
  });

export const useLatestByPatientQuery = (patientId?: string, scoreName?: ScoreName) =>
  useQuery({
    queryKey: queryKeys.scoresLatest(patientId ?? 'empty', scoreName),
    queryFn: () => scoresApi.latestByPatient(patientId!),
    enabled: Boolean(patientId),
  });
