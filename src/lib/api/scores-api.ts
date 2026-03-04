import { http } from '@/lib/api/http';
import type { ModuleRecord, ScorePayload } from '@/types/clinical-modules';

export interface CalculateScoreDto {
  scoreType: string;
  patientId: string;
  inputs: Record<string, string | number | boolean>;
  result?: {
    scoreValue: string;
    interpretation: string;
    riskLevel: 'verde' | 'amarelo' | 'laranja' | 'vermelho';
  };
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
  async calculate(payload: CalculateScoreDto): Promise<{ status: string }> {
    const { data } = await http.post<{ status: string }>('/scores/calculate', payload);
    return data;
  },
};
