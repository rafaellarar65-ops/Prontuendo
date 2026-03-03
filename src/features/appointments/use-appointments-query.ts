import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useAppointmentsQuery = (date: string) =>
  useQuery({
    queryKey: queryKeys.appointmentsByDate(date),
    queryFn: () => appointmentsApi.listByDate(date),
  });
