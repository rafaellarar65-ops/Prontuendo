import { http } from '@/lib/api/http';

export type ScoreType = 'imc' | 'chads2vasc' | 'hasbled';

export type ScoreName = 'HOMA-IR' | 'FINDRISC' | 'BMI' | 'CKD-EPI' | 'BMR';

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

export type ClinicalScoreInput<TType extends ScoreType = ScoreType> = ClinicalScoreInputByType[TType];

export interface ClinicalScoreResult<TType extends ScoreType = ScoreType> {
  patientId: string;
  scoreType: TType;
  value: number;
  interpretation?: string | null;
  calculatedAt: string;
  breakdown?: Record<string, number | string | boolean>;
}

export interface ClinicalScoreHistoryRecord<TName extends ScoreName = ScoreName> {
  id: string;
  patientId: string;
  scoreName: TName;
  inputs: Record<string, unknown>;
  result: {
    value: string | number;
    interpretation?: string | null;
  };
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
  [key: ScoreName | string]: unknown;
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

  async history<TName extends ScoreName = ScoreName>(
    patientId: string,
    scoreName?: TName,
  ): Promise<Array<ClinicalScoreHistoryRecord<TName>>> {
    const { data } = await http.get<Array<ClinicalScoreHistoryRecord<TName>>>('/scores', {
      params: {
        patientId,
        ...(scoreName ? { scoreName } : {}),
      },
    });
    return data;
  },

  async latestByPatient(patientId: string): Promise<LatestScoresPayload> {
    const { data } = await http.get<LatestScoresPayload>('/scores/latest', {
      params: { patientId },
    });
    return data;
  },
};
