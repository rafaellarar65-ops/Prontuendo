import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const usePatientAppointmentsQuery = (patientId?: string) =>
  useQuery({
    queryKey: queryKeys.appointmentsByPatient(patientId ?? 'empty'),
    queryFn: () => appointmentsApi.listByPatient(patientId ?? ''),
    enabled: Boolean(patientId),
  });
