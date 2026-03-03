import { http } from '@/lib/api/http';
import type { ModuleRecord, ScorePayload } from '@/types/clinical-modules';

export interface ScoreMetric {
  value?: string | number | null;
  interpretation?: string | null;
}

export interface LatestScoresPayload {
  homaIr?: ScoreMetric | null;
  imc?: ScoreMetric | null;
  estimatedHba1c?: ScoreMetric | null;
  [key: string]: unknown;
}

export const scoresApi = {
  async list(): Promise<Array<ModuleRecord<ScorePayload>>> {
    const { data } = await http.get<Array<ModuleRecord<ScorePayload>>>('/scores');
    return data;
  },
  async create(payload: ScorePayload): Promise<ModuleRecord<ScorePayload>> {
    const { data } = await http.post<ModuleRecord<ScorePayload>>('/scores', { payload });
    return data;
  },
  async update(id: string, payload: Partial<ScorePayload>): Promise<ModuleRecord<ScorePayload> | null> {
    const { data } = await http.patch<ModuleRecord<ScorePayload> | null>(`/scores/${id}`, { payload });
    return data;
  },
  async latest(patientId: string): Promise<LatestScoresPayload> {
    const { data } = await http.get<LatestScoresPayload>('/scores/latest', {
      params: { patientId },
    });
    return data;
  },
};
