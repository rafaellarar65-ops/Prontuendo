import { useMutation, useQueryClient } from '@tanstack/react-query';
import { protocolsApi } from '@/lib/api/protocols-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProtocolPayload } from '@/types/clinical-modules';

const invalidateProtocolsList = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: queryKeys.protocols, exact: false });

export const useCreateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProtocolPayload) => protocolsApi.create(payload),
    onSuccess: () => {
      void invalidateProtocolsList(qc);
    },
  });
};

export const useUpdateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProtocolPayload> }) => protocolsApi.update(id, payload),
    onSuccess: (_, variables) => {
      void invalidateProtocolsList(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.protocolById(variables.id) });
    },
  });
};

export const useActivateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => protocolsApi.activate(id),
    onSuccess: (_, id) => {
      void invalidateProtocolsList(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.protocolById(id) });
    },
  });
};

export const useDeactivateProtocolMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => protocolsApi.deactivate(id),
    onSuccess: (_, id) => {
      void invalidateProtocolsList(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.protocolById(id) });
    },
  });
};
