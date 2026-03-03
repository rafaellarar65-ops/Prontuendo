import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useAppointmentsRangeQuery = (start?: string, end?: string) =>
  useQuery({
    queryKey: queryKeys.appointmentsByRange(start ?? 'empty', end ?? 'empty'),
    queryFn: () => appointmentsApi.listByRange(start ?? '', end ?? ''),
    enabled: Boolean(start && end),
  });
