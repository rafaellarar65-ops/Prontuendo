import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api/http';
import { queryKeys } from '@/lib/query/query-keys';

export interface GlucoseRecord {
  id: string;
  patientId: string;
  value: number;
  measuredAt: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const useGlucoseQuery = (patientId: string) =>
  useQuery({
    queryKey: queryKeys.glucose(patientId),
    queryFn: async () => {
      const { data } = await http.get<GlucoseRecord[]>(`/glucose/${patientId}`);
      return data;
    },
    enabled: Boolean(patientId),
  });
