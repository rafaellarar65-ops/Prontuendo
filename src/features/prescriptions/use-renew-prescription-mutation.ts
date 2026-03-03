import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { RenewPrescriptionDto } from '@/lib/api/prescription-api';

export const useRenewPrescriptionMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: RenewPrescriptionDto }) => prescriptionApi.renew(id, dto),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByPatient(updated.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activePrescriptions(updated.patientId) });

      if (updated.consultationId) {
        void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByConsultation(updated.consultationId) });
      }
    },
  });
};
