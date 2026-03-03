import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CancelPrescriptionDto } from '@/lib/api/prescription-api';

export const useCancelPrescriptionMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: CancelPrescriptionDto }) => prescriptionApi.cancel(id, dto),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByPatient(updated.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activePrescriptions(updated.patientId) });

      if (updated.consultationId) {
        void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByConsultation(updated.consultationId) });
      }
    },
  });
};
