import { useQuery } from '@tanstack/react-query';
import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useConsultationsQuery = (patientId?: string) =>
  useQuery({
    queryKey: patientId ? ([...queryKeys.consultations, patientId] as const) : queryKeys.consultations,
    queryFn: () => consultationApi.list(patientId),
  });
