import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient-api';
import { queryKeys } from '@/lib/query/query-keys';

export const usePatientDetailQuery = (patientId?: string) =>
  useQuery({
    queryKey: patientId ? queryKeys.patientDetail(patientId) : queryKeys.patientDetail('empty'),
    queryFn: () => patientApi.detail(patientId ?? ''),
    enabled: Boolean(patientId),
  });
