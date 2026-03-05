import { useQuery } from '@tanstack/react-query';
import { scoresApi, type ScoreType } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useScoreHistoryQuery = (patientId?: string, scoreType?: ScoreType) =>
  useQuery({
    queryKey: queryKeys.scoresHistory(patientId ?? 'empty', scoreType),
    queryFn: () => scoresApi.history(patientId!, scoreType),
    enabled: Boolean(patientId),
  });

export const useLatestScoreQuery = (patientId?: string) =>
  useQuery({
    queryKey: queryKeys.scoresLatest(patientId ?? 'empty'),
    queryFn: () => scoresApi.latest(patientId!),
    enabled: Boolean(patientId),
  });
