import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api/http';

export interface GlucoseItem {
  id: string;
  value: number;
  measuredAt: string;
  notes?: string;
}

interface GlucoseAnalysis {
  timeInRange?: number;
  average?: number;
  estimatedA1c?: number;
  insight?: string;
}

const glucoseKey = (patientId: string) => ['patient-portal', patientId, 'glucose'] as const;
const glucoseAnalysisKey = (patientId: string) => ['patient-portal', patientId, 'glucose-analysis'] as const;

export const useGlucoseQuery = (patientId?: string) =>
  useQuery({
    queryKey: glucoseKey(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { data } = await http.get(`/patient-portal/${patientId}/glucose`);
      if (Array.isArray(data)) return data as GlucoseItem[];
      if (Array.isArray(data?.items)) return data.items as GlucoseItem[];
      return [] as GlucoseItem[];
    },
  });

export const useGlucoseAnalysisQuery = (patientId?: string) =>
  useQuery({
    queryKey: glucoseAnalysisKey(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { data } = await http.get(`/patient-portal/${patientId}/glucose/analysis`);
      return (data ?? {}) as GlucoseAnalysis;
    },
  });

export const useCreateGlucoseMutation = (patientId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { value: number; notes?: string; measuredAt?: string }) => {
      if (!patientId) throw new Error('patientId ausente');

      const { data } = await http.post(`/patient-portal/${patientId}/glucose`, {
        ...payload,
        measuredAt: payload.measuredAt ?? new Date().toISOString(),
      });

      return data;
    },
    onSuccess: async () => {
      if (!patientId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: glucoseKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: glucoseAnalysisKey(patientId) }),
      ]);
    },
  });
};
