import { useQuery } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useBioimpedanceEvolutionQuery = () =>
  useQuery({
    queryKey: queryKeys.bioimpedanceEvolution,
    queryFn: bioimpedanceApi.evolution,
  });
