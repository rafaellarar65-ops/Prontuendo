import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useRenewPrescriptionMutation = (patientId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: string) => prescriptionApi.renew(prescriptionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.activePrescriptions(patientId) });
    },
  });
};
