export interface BioimpedanceUpload {
  fileName: string;
  uploadedAt: string;
  status: 'uploaded' | 'previewed' | 'confirmed';
}

export interface BioimpedanceAiPreview {
  hydrationPercent: number;
  muscleMassKg: number;
  fatMassPercent: number;
  flags: string[];
}

export interface BioimpedancePoint {
  date: string;
  fatMassPercent: number;
  muscleMassKg: number;
}

export type BioimpedanceMetadataSource = 'manual' | 'ia';

export interface BioimpedanceMetadata {
  source: BioimpedanceMetadataSource;
  segmentedFields?: Record<string, unknown>;
  originalFileUrl?: string;
  originalFileName?: string;
}

export interface BioimpedanceClinicalFields {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  muscleMassKg?: number | null;
  hydrationPct?: number | null;
  bmi?: number | null;
  visceralFatLevel?: number | null;
  basalMetabolicRateKcal?: number | null;
  waistHipRatio?: number | null;
  phaseAngle?: number | null;
  totalBodyWaterPct?: number | null;
  fatMassKg?: number | null;
  leanMassKg?: number | null;
}

export interface BioimpedanceExam extends BioimpedanceClinicalFields {
  id: string;
  tenantId: string;
  patientId: string;
  measuredAt: string;
  metadata?: BioimpedanceMetadata | null;
  createdAt: string;
  /** Campos legados mantidos para compatibilidade de leitura. */
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
}

export type CreateBioimpedanceDto = Omit<BioimpedanceExam, 'id' | 'tenantId' | 'createdAt' | 'patientId'>;
export type CreateBioimpedancePayload = CreateBioimpedanceDto;

export interface BioimpedanceAiExtractionResponse extends Partial<BioimpedanceClinicalFields> {
  measuredAt?: string;
  segmentedFields?: Record<string, unknown>;
  originalFileUrl?: string;
  originalFileName?: string;
}

export interface BioimpedanceFormValues extends Partial<BioimpedanceClinicalFields> {
  measuredAt: string;
  source: BioimpedanceMetadataSource;
  segmentedFields?: Record<string, unknown>;
  originalFileUrl?: string;
  originalFileName?: string;
}
