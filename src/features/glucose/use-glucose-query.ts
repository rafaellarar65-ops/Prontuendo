import { useQuery } from '@tanstack/react-query';
import { glucoseApi } from '@/lib/api/glucose-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useGlucoseQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.glucoseHistory(patientId),
    queryFn: () => glucoseApi.list(patientId),
    enabled: Boolean(patientId),
  });
