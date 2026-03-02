import { useQuery } from '@tanstack/react-query';
import { glucoseApi } from '@/lib/api/glucose-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useGlucoseAnalysisQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.glucoseAnalysis(patientId),
    queryFn: () => glucoseApi.analysis(patientId),
    enabled: Boolean(patientId),
  });
