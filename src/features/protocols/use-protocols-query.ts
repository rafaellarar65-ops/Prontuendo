import { useQuery } from '@tanstack/react-query';
import { protocolsApi, type ProtocolListParams } from '@/lib/api/protocols-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useProtocolsQuery = (filters?: ProtocolListParams) =>
  useQuery({
    queryKey: queryKeys.protocolsList(filters),
    queryFn: () => protocolsApi.list(filters),
  });
