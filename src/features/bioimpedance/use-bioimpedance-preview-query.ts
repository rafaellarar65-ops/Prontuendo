import { useQuery } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useBioimpedancePreviewQuery = () =>
  useQuery({
    queryKey: queryKeys.bioimpedancePreview,
    queryFn: bioimpedanceApi.aiPreview,
  });
