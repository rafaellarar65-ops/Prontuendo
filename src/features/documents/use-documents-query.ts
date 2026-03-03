import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { DocumentCategory } from '@/types/documents';

export const useDocumentsQuery = (patientId?: string, category?: DocumentCategory) =>
  useQuery({
    queryKey: queryKeys.documentsByPatient(patientId ?? 'empty', category),
    queryFn: () => documentsApi.listByPatient(patientId!, category),
    enabled: Boolean(patientId),
  });
