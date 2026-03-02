import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationApi } from '@/lib/api/consultation-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { ConsultationDraft, ConsultationRecord } from '@/lib/api/consultation-api';

export interface ConsultationMutationError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface AutosaveConsultationInput extends Pick<ConsultationDraft, 'subjetivo' | 'objetivo' | 'avaliacao' | 'plano'> {
  id: string;
}

export const toConsultationMutationError = (error: unknown): ConsultationMutationError => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; code?: string; details?: unknown } | undefined;

    return {
      message: responseData?.message ?? error.message ?? 'Não foi possível salvar o rascunho da consulta.',
      ...(error.response?.status !== undefined ? { status: error.response.status } : {}),
      ...(responseData?.code !== undefined ? { code: responseData.code } : {}),
      ...(responseData?.details !== undefined ? { details: responseData.details } : {}),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Não foi possível salvar o rascunho da consulta.' };
};

export const useAutosaveConsultationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ConsultationRecord, ConsultationMutationError, AutosaveConsultationInput>({
    mutationFn: async ({ id, subjetivo, objetivo, avaliacao, plano }) => {
      try {
        const payload: ConsultationDraft = {
          ...(subjetivo !== undefined ? { subjetivo } : {}),
          ...(objetivo !== undefined ? { objetivo } : {}),
          ...(avaliacao !== undefined ? { avaliacao } : {}),
          ...(plano !== undefined ? { plano } : {}),
        };

        return await consultationApi.autosave(id, payload);
      } catch (error) {
        throw toConsultationMutationError(error);
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.consultations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consultationById(variables.id) }),
      ]);
    },
  });
};
