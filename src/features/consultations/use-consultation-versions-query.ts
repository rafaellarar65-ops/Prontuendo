import { useQuery } from '@tanstack/react-query';

import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useConsultationVersionsQuery = (consultationId: string | null) =>
  useQuery({
    queryKey: consultationId ? queryKeys.consultationVersions(consultationId) : ['consultations', 'versions', 'disabled'],
    queryFn: () => consultationApi.listVersions(consultationId as string),
    enabled: Boolean(consultationId),
  });

export const useConsultationVersionQuery = (consultationId: string | null, version: number | null) =>
  useQuery({
    queryKey:
      consultationId && version !== null
        ? queryKeys.consultationVersion(consultationId, version)
        : ['consultations', 'version', 'disabled'],
    queryFn: () => consultationApi.getVersion(consultationId as string, version as number),
    enabled: Boolean(consultationId) && version !== null,
  });
