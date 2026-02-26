import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicsApi } from '@/lib/api/clinics-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { ClinicPayload } from '@/types/clinical-modules';

export const useCreateClinicMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClinicPayload) => clinicsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clinics });
    },
  });
};

export const useUpdateClinicMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClinicPayload> }) => clinicsApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clinics });
    },
  });
};
