import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useAppointmentsQuery = (date?: string) =>
  useQuery({
    queryKey: date ? queryKeys.appointmentsByDate(date) : queryKeys.appointments,
    queryFn: () => appointmentsApi.listByDate(date ?? ''),
    enabled: Boolean(date),
  });
