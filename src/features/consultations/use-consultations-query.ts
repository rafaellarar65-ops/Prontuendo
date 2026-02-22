import { useQuery } from '@tanstack/react-query';
import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useConsultationsQuery = () =>
  useQuery({
    queryKey: queryKeys.consultations,
    queryFn: consultationApi.list,
  });
