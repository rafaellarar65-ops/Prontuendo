import { http } from '@/lib/api/http';

export interface GlucoseLog {
  id: string;
  patientId: string;
  measuredAt: string;
  value: number;
  mealContext?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GlucoseAnalysis {
  patientId: string;
  average: number;
  min: number;
  max: number;
  inRangePercent: number;
  generatedAt: string;
}

export const glucoseApi = {
  async list(patientId: string, limit = 50): Promise<GlucoseLog[]> {
    const { data } = await http.get<GlucoseLog[]>('/glucose', {
      params: { patientId, limit },
    });
    return data;
  },

  async create(dto: Omit<GlucoseLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<GlucoseLog> {
    const { data } = await http.post<GlucoseLog>('/glucose', dto);
    return data;
  },

  async analyze(patientId: string): Promise<GlucoseAnalysis> {
    const { data } = await http.get<GlucoseAnalysis>('/glucose/analyze', {
      params: { patientId },
    });
    return data;
  },
};
