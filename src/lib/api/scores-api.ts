import { http } from '@/lib/api/http';

export type ScoreType = 'imc' | 'chads2vasc' | 'hasbled' | 'homa_ir' | 'findrisc' | 'bmr' | 'ckd_epi' | (string & {});

export interface ImcScoreInput {
  weightKg: number;
  heightCm: number;
}

export interface Chads2VascScoreInput {
  age: number;
  sex: 'male' | 'female';
  congestiveHeartFailure: boolean;
  hypertension: boolean;
  diabetesMellitus: boolean;
  strokeOrTiaOrThromboembolism: boolean;
  vascularDisease: boolean;
}

export interface HasBledScoreInput {
  hypertension: boolean;
  abnormalRenalFunction: boolean;
  abnormalLiverFunction: boolean;
  strokeHistory: boolean;
  bleedingHistory: boolean;
  labileInr: boolean;
  ageOver65: boolean;
  drugUse: boolean;
  alcoholUse: boolean;
}

export interface ClinicalScoreInputByType {
  imc: ImcScoreInput;
  chads2vasc: Chads2VascScoreInput;
  hasbled: HasBledScoreInput;
}

export type ClinicalScoreInput<TType extends ScoreType = ScoreType> = TType extends keyof ClinicalScoreInputByType ? ClinicalScoreInputByType[TType] : Record<string, string | number | boolean>;

export interface ClinicalScoreResult<TType extends ScoreType = ScoreType> {
  patientId: string;
  scoreType: TType;
  value: number;
  interpretation?: string | null;
  calculatedAt: string;
  breakdown?: Record<string, number | string | boolean>;
}

export interface ClinicalScoreHistoryRecord<TType extends ScoreType = ScoreType> {
  id: string;
  patientId: string;
  scoreType: TType;
  inputs: ClinicalScoreInput<TType>;
  result: ClinicalScoreResult<TType>;
  createdAt: string;
  updatedAt: string;
}

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
  async calculate<TType extends ScoreType>(
    patientId: string,
    scoreType: TType,
    inputs: ClinicalScoreInput<TType>,
  ): Promise<ClinicalScoreResult<TType>> {
    const { data } = await http.post<ClinicalScoreResult<TType>>('/scores/calculate', {
      patientId,
      scoreType,
      inputs,
    });
    return data;
  },

  async history<TType extends ScoreType = ScoreType>(
    patientId: string,
    scoreType?: TType,
  ): Promise<Array<ClinicalScoreHistoryRecord<TType>>> {
    const { data } = await http.get<Array<ClinicalScoreHistoryRecord<TType>>>('/scores', {
      params: {
        patientId,
        ...(scoreType ? { scoreType } : {}),
      },
    });
    return data;
  },

  async latest(patientId: string): Promise<LatestScoresPayload> {
    const { data } = await http.get<LatestScoresPayload>('/scores/latest', {
      params: { patientId },
    });
    return data;
  },
};
