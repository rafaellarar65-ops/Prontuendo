import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useUploadBioimpedanceMutation = () =>
  useMutation({
    mutationFn: bioimpedanceApi.upload,
  });

export const useConfirmBioimpedanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bioimpedanceApi.confirm,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bioimpedanceEvolution });
    },
  });
};

export const useGenerateBioimpedanceReportMutation = () =>
  useMutation({
    mutationFn: bioimpedanceApi.report,
  });
