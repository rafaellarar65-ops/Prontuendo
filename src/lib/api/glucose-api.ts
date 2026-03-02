import { http } from '@/lib/api/http';

export interface GlucoseMeasurement {
  id: string;
  patientId: string;
  value: number;
  measuredAt: string;
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

const getRangePercent = (items: GlucoseMeasurement[]) => {
  if (!items.length) return 0;
  const inRange = items.filter((item) => item.value >= 70 && item.value <= 180).length;
  return Math.round((inRange / items.length) * 100);
};

export const glucoseApi = {
  async list(patientId: string): Promise<GlucoseMeasurement[]> {
    const { data } = await http.get<GlucoseMeasurement[]>(`/glucose/${patientId}/history`);
    return data;
  },
  async create(dto: CreateGlucoseMeasurementDto): Promise<GlucoseMeasurement> {
    const { data } = await http.post<GlucoseMeasurement>('/glucose', dto);
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
