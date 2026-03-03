import { useQuery } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';

export const usePrescriptionsQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.prescriptionsByPatient(patientId),
    queryFn: () => prescriptionApi.listByPatient(patientId),
    enabled: Boolean(patientId),
  });
