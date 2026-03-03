import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, type UploadDocumentDto } from '@/lib/api/documents-api';

export const useUploadDocumentMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: UploadDocumentDto) => documentsApi.upload(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ['documents', created.patientId] });
    },
  });
};
