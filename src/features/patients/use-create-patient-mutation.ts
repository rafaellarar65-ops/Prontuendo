import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreatePatientDto } from '@/types/api';

export const useCreatePatientMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePatientDto) => patientApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
};
