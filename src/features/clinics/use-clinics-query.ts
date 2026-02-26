import { useQuery } from '@tanstack/react-query';
import { clinicsApi } from '@/lib/api/clinics-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useClinicsQuery = () =>
  useQuery({
    queryKey: queryKeys.clinics,
    queryFn: clinicsApi.list,
  });
