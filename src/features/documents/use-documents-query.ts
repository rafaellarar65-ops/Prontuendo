import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useDocumentsQuery = (patientId: string, category?: string) => useQuery({
  queryKey: queryKeys.documents(patientId, category),
  queryFn: () => documentsApi.list(patientId, category),
  enabled: !!patientId,
});
