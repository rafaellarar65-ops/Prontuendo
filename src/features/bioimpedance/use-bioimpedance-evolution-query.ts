import { useQuery } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useBioimpedanceEvolutionQuery = (patientId?: string) =>
  useQuery({
    queryKey: queryKeys.bioimpedanceEvolution(patientId),
    queryFn: () => bioimpedanceApi.evolution(patientId),
  });
