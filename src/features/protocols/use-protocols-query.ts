import { useQuery } from '@tanstack/react-query';
import { protocolsApi } from '@/lib/api/protocols-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useProtocolsQuery = () =>
  useQuery({
    queryKey: queryKeys.protocols,
    queryFn: () => protocolsApi.list(),
  });

export const useProtocolsByConditionQuery = (condition?: string) =>
  useQuery({
    queryKey: queryKeys.protocolsByCondition(condition ?? ''),
    queryFn: () => protocolsApi.list(condition),
    enabled: Boolean(condition),
  });
