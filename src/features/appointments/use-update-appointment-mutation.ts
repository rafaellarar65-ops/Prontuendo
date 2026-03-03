import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

type UpdateAppointmentPayload = {
  id: string;
  data: Partial<CreateAppointmentDto> & { status?: Appointment['status'] };
};

export const useUpdateAppointmentMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateAppointmentPayload) => appointmentsApi.update(id, data),
    onSuccess: async (appointment) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.appointments }),
        qc.invalidateQueries({ queryKey: queryKeys.appointmentsByDate(appointment.date) }),
        qc.invalidateQueries({ queryKey: queryKeys.appointmentsByPatient(appointment.patientId) }),
      ]);
    },
  });
};
