import { useQuery } from '@tanstack/react-query';
import { templateBuilderApi } from '@/lib/api/template-builder-api';
import { queryKeys } from '@/lib/query/query-keys';

export const useTemplateBuilderElementsQuery = () =>
  useQuery({
    queryKey: queryKeys.templateBuilderElements,
    queryFn: templateBuilderApi.listElements,
  });

export const useTemplateBuilderVariablesQuery = () =>
  useQuery({
    queryKey: queryKeys.templateBuilderVariables,
    queryFn: templateBuilderApi.listVariables,
  });
