import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { CreatePrescriptionDto } from '@/lib/api/prescription-api';

export const useCreatePrescriptionMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePrescriptionDto) => prescriptionApi.create(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByPatient(created.patientId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activePrescriptions(created.patientId) });

      if (created.consultationId) {
        void qc.invalidateQueries({ queryKey: queryKeys.prescriptionsByConsultation(created.consultationId) });
      }
    },
  });
};
