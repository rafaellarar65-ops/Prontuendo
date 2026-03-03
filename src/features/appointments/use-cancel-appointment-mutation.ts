import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useCancelAppointmentMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: async (appointment) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.appointments }),
        qc.invalidateQueries({ queryKey: queryKeys.appointmentsByDate(appointment.date) }),
        qc.invalidateQueries({ queryKey: queryKeys.appointmentsByPatient(appointment.patientId) }),
      ]);
    },
  });
};
