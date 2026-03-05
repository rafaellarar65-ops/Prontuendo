import { http } from '@/lib/api/http';
import type {
  BioimpedanceAiExtractionResponse,
  BioimpedanceAiPreview,
  BioimpedanceExam,
  BioimpedanceFormValues,
  BioimpedancePoint,
  BioimpedanceUpload,
  BioimpedanceMetadata,
  BioimpedanceSegmentedFields,
  CreateBioimpedancePayload,
} from '@/types/bioimpedance';

export type CreateBioimpedanceDto = CreateBioimpedancePayload;

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
};

const resolveExamMetric = (exam: BioimpedanceExam, primaryField: keyof BioimpedanceExam, legacyField?: keyof BioimpedanceExam): number => {
  const segmented = exam.metadata?.segmentedFields;
  const candidateValues: unknown[] = [exam[primaryField]];

  if (legacyField) {
    candidateValues.push(exam[legacyField]);
  }

  if (segmented && typeof segmented === 'object') {
    candidateValues.push((segmented as Record<string, unknown>)[primaryField as string]);
    if (legacyField) {
      candidateValues.push((segmented as Record<string, unknown>)[legacyField as string]);
    }
  }

  for (const value of candidateValues) {
    const parsed = parseNumber(value);
    if (parsed !== null) return parsed;
  }

  return 0;
};

const mapExtractedClinicalFields = (extracted: BioimpedanceAiExtractionResponse): Partial<BioimpedanceFormValues> => {
  const bodyFatPct = extracted.bodyFatPct ?? extracted.fatMassPercent;
  const muscleMassKg = extracted.muscleMassKg ?? extracted.muscleMass;

  return {
    ...(extracted.weightKg !== undefined ? { weightKg: extracted.weightKg } : {}),
    ...(bodyFatPct !== undefined ? { bodyFatPct } : {}),
    ...(muscleMassKg !== undefined ? { muscleMassKg } : {}),
    ...(extracted.hydrationPct !== undefined ? { hydrationPct: extracted.hydrationPct } : {}),
    ...(extracted.bmi !== undefined ? { bmi: extracted.bmi } : {}),
    ...(extracted.visceralFatLevel !== undefined ? { visceralFatLevel: extracted.visceralFatLevel } : {}),
    ...(extracted.basalMetabolicRateKcal !== undefined
      ? { basalMetabolicRateKcal: extracted.basalMetabolicRateKcal }
      : {}),
    ...(extracted.waistHipRatio !== undefined ? { waistHipRatio: extracted.waistHipRatio } : {}),
    ...(extracted.phaseAngle !== undefined ? { phaseAngle: extracted.phaseAngle } : {}),
    ...(extracted.totalBodyWaterPct !== undefined ? { totalBodyWaterPct: extracted.totalBodyWaterPct } : {}),
    ...(extracted.fatMassKg !== undefined ? { fatMassKg: extracted.fatMassKg } : {}),
    ...(extracted.leanMassKg !== undefined ? { leanMassKg: extracted.leanMassKg } : {}),
  };
};

const buildMetadata = (form: BioimpedanceFormValues): BioimpedanceMetadata => ({
  source: form.source,
  ...(form.segmentedFields ? { segmentedFields: form.segmentedFields as BioimpedanceSegmentedFields } : {}),
  ...(form.originalFileUrl ? { originalFileUrl: form.originalFileUrl } : {}),
  ...(form.originalFileName ? { originalFileName: form.originalFileName } : {}),
});

export const mapBioimpedanceAiToFormValues = (
  extracted: BioimpedanceAiExtractionResponse,
): BioimpedanceFormValues => ({
  measuredAt: extracted.measuredAt ?? new Date().toISOString(),
  source: 'ia',
  ...mapExtractedClinicalFields(extracted),
  ...(extracted.segmentedFields ? { segmentedFields: extracted.segmentedFields } : {}),
  ...(extracted.originalFileUrl ? { originalFileUrl: extracted.originalFileUrl } : {}),
  ...(extracted.originalFileName ? { originalFileName: extracted.originalFileName } : {}),
});

export const mapBioimpedanceFormToCreatePayload = (
  patientId: string,
  form: BioimpedanceFormValues,
): CreateBioimpedanceDto => ({
  patientId,
  measuredAt: form.measuredAt,
  weightKg: form.weightKg ?? null,
  bodyFatPct: form.bodyFatPct ?? null,
  muscleMassKg: form.muscleMassKg ?? null,
  hydrationPct: form.hydrationPct ?? null,
  bmi: form.bmi ?? null,
  visceralFatLevel: form.visceralFatLevel ?? null,
  basalMetabolicRateKcal: form.basalMetabolicRateKcal ?? null,
  waistHipRatio: form.waistHipRatio ?? null,
  phaseAngle: form.phaseAngle ?? null,
  totalBodyWaterPct: form.totalBodyWaterPct ?? null,
  fatMassKg: form.fatMassKg ?? null,
  leanMassKg: form.leanMassKg ?? null,
  metadata: buildMetadata(form),
});

export const bioimpedanceApi = {
  async list(patientId: string): Promise<BioimpedanceExam[]> {
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance', {
      params: { patientId },
    });
    return data;
  },

  async create(dto: CreateBioimpedanceDto): Promise<BioimpedanceExam> {
    const { patientId, ...payload } = dto;
    const { data } = await http.post<BioimpedanceExam>(`/bioimpedance/${patientId}`, payload);
    return data;
  },

  async upload(fileName: string): Promise<BioimpedanceUpload> {
    return Promise.resolve({ fileName, uploadedAt: new Date().toISOString(), status: 'uploaded' });
  },

  async aiPreview(patientId?: string): Promise<BioimpedanceAiPreview> {
    if (!patientId) {
      return { hydrationPercent: 0, muscleMassKg: 0, fatMassPercent: 0, flags: [] };
    }
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance', { params: { patientId } });
    const latestExam = data[0];

    if (!latestExam) {
      return { hydrationPercent: 0, muscleMassKg: 0, fatMassPercent: 0, flags: [] };
    }

    return {
      hydrationPercent: resolveExamMetric(latestExam, 'hydrationPct'),
      muscleMassKg: resolveExamMetric(latestExam, 'muscleMassKg', 'muscleMass'),
      fatMassPercent: resolveExamMetric(latestExam, 'bodyFatPct', 'bodyFatPercent'),
      flags: [],
    };
  },

  async confirm(): Promise<{ success: true }> {
    return Promise.resolve({ success: true });
  },

  async evolution(patientId?: string): Promise<BioimpedancePoint[]> {
    if (!patientId) return [];
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance', {
      params: { patientId },
    });

    return data
      .map((exam) => ({
        date: exam.measuredAt ?? exam.createdAt,
        fatMassPercent: resolveExamMetric(exam, 'bodyFatPct', 'bodyFatPercent'),
        muscleMassKg: resolveExamMetric(exam, 'muscleMassKg', 'muscleMass'),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async report(): Promise<{ reportUrl: string }> {
    return Promise.resolve({ reportUrl: '/reports/bioimpedance.pdf' });
  },
};
