import { useQuery } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useActivePrescriptionsQuery = (patientId: string) => useQuery({
  queryKey: queryKeys.activePrescriptions(patientId),
  queryFn: () => prescriptionApi.listActive(patientId),
  enabled: !!patientId,
});
