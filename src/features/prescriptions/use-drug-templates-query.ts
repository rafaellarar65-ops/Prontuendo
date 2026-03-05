import { useQuery } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useDrugTemplatesQuery = () =>
  useQuery({
    queryKey: queryKeys.drugTemplates,
    queryFn: () => prescriptionApi.listDrugTemplates(),
  });
