import { useQuery } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/template-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useConsultationTemplatesQuery = () =>
  useQuery({
    queryKey: queryKeys.consultationTemplates,
    queryFn: templateApi.listConsultationTemplates,
  });
