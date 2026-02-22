import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient-api';
import { queryKeys } from '@/lib/query/query-keys';

export const usePatientsQuery = () =>
  useQuery({
    queryKey: queryKeys.patients,
    queryFn: patientApi.list,
  });
