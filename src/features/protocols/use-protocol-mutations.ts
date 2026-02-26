import { useMutation, useQueryClient } from '@tanstack/react-query';
import { protocolsApi } from '@/lib/api/protocols-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProtocolPayload } from '@/types/clinical-modules';

export const useCreateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProtocolPayload) => protocolsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.protocols });
    },
  });
};

export const useUpdateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProtocolPayload> }) => protocolsApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.protocols });
    },
  });
};
