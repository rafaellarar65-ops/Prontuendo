import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreateAppointmentDto } from '@/types/api';

export const useCreateAppointmentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAppointmentDto) => appointmentsApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
};
