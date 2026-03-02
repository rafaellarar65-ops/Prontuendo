import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useGlucoseAnalysisQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.analysis(patientId),
    queryFn: () => aiApi.glucoseAnalysis({ patientId }),
    enabled: Boolean(patientId),
  });
