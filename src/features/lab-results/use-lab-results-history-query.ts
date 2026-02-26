import { useQuery } from '@tanstack/react-query';
import { labResultsApi } from '@/lib/api/lab-results-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useLabResultsHistoryQuery = (patientId: string, examName?: string) =>
  useQuery({
    queryKey: queryKeys.labResultsHistory(patientId, examName),
    queryFn: () => labResultsApi.history(patientId, examName),
    enabled: Boolean(patientId),
  });
