import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useCancelAppointmentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
};
