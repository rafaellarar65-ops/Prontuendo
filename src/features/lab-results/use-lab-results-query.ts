import { useQuery } from '@tanstack/react-query';
import { labResultsApi } from '@/lib/api/lab-results-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useLabResultsQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.labResults(patientId),
    queryFn: () => labResultsApi.history(patientId),
    enabled: Boolean(patientId),
  });
