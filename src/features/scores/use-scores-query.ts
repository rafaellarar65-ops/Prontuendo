import { useQuery } from '@tanstack/react-query';
import { scoresApi } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useScoresQuery = () =>
  useQuery({
    queryKey: queryKeys.scores,
    queryFn: scoresApi.list,
  });
