import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { UploadDocumentDto } from '@/types/documents';

export const useUploadDocumentMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: UploadDocumentDto) => documentsApi.upload(dto),
    onSuccess: (created) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.documentsByPatient(created.patientId),
      });
    },
  });
};
