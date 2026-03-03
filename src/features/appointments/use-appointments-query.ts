import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

type AppointmentsQueryParams = {
  date?: string;
};

type AppointmentsRangeParams = {
  from: string;
  to: string;
};

export const useAppointmentsQuery = (params?: string | AppointmentsQueryParams) =>
  useQuery({
    queryKey:
      typeof params === 'string'
        ? queryKeys.appointmentsByDate(params)
        : params?.date
          ? queryKeys.appointmentsByDate(params.date)
          : queryKeys.appointments,
    queryFn: () =>
      appointmentsApi.list(
        typeof params === 'string' ? { date: params } : params,
      ),
  });

export const useAppointmentsRangeQuery = ({ from, to }: AppointmentsRangeParams) =>
  useQuery({
    queryKey: queryKeys.appointmentsByRange(from, to),
    queryFn: () => appointmentsApi.list({ from, to }),
    enabled: Boolean(from && to),
  });
