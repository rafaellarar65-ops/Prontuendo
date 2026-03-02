import { useQuery } from '@tanstack/react-query';
import { labApi } from '@/lib/api/lab-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useLabResultsHistoryQuery = (patientId: string, examName?: string) =>
  useQuery({
    queryKey: queryKeys.labResultsHistory(patientId, examName),
    queryFn: async () => {
      const results = await labApi.list(patientId);
      if (!examName) {
        return results;
      }

      return results.filter((result) => result.examName === examName);
    },
    enabled: Boolean(patientId),
  });
