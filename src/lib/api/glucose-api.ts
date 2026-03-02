import { http } from '@/lib/api/http';

export interface GlucoseLog {
  id: string;
  patientId: string;
  measuredAt: string;
  value: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGlucoseMeasurementDto {
  patientId: string;
  value: number;
  measuredAt: string;
  notes?: string;
}

export interface GlucoseAnalysis {
  average: number;
  min: number;
  max: number;
  total: number;
  inRangePercent: number;
}

const getRangePercent = (items: GlucoseLog[]) => {
  if (!items.length) return 0;
  const inRange = items.filter((item) => item.value >= 70 && item.value <= 180).length;
  return Math.round((inRange / items.length) * 100);
};

export const glucoseApi = {
  async list(patientId: string, limit = 50): Promise<GlucoseLog[]> {
    const { data } = await http.get<GlucoseLog[]>('/glucose', {
      params: { patientId, limit },
    });
    return data;
  },

  async create(dto: CreateGlucoseMeasurementDto): Promise<GlucoseLog> {
    const { data } = await http.post<GlucoseLog>('/glucose', dto);
    return data;
  },

  async analyze(patientId: string) {
    const { data } = await http.get('/glucose/analyze', { params: { patientId } });
    return data;
  },

  async analysis(patientId: string): Promise<GlucoseAnalysis> {
    const items = await glucoseApi.list(patientId);
    if (!items.length) {
      return { average: 0, min: 0, max: 0, total: 0, inRangePercent: 0 };
    }
    const values = items.map((item) => item.value);
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return {
      average,
      min: Math.min(...values),
      max: Math.max(...values),
      total: items.length,
      inRangePercent: getRangePercent(items),
    };
  },
};
