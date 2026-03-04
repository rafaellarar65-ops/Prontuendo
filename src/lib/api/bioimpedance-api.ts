import { http } from '@/lib/api/http';
import type {
  BioimpedanceAiPreview,
  BioimpedancePoint,
  BioimpedanceUpload,
} from '@/types/bioimpedance';

export interface BioimpedanceExam {
  id: string;
  tenantId: string;
  patientId: string;
  measuredAt: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  muscleMassKg?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateBioimpedanceDto {
  measuredAt: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  muscleMassKg?: number | null;
  metadata?: Record<string, unknown> | null;
}

export const bioimpedanceApi = {
  async list(patientId: string): Promise<BioimpedanceExam[]> {
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance', {
      params: { patientId },
    });
    return data;
  },

  async create(patientId: string, dto: CreateBioimpedanceDto): Promise<BioimpedanceExam> {
    const { data } = await http.post<BioimpedanceExam>(`/bioimpedance/${patientId}`, dto);
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
      hydrationPercent: 0,
      muscleMassKg: latestExam.muscleMassKg ?? 0,
      fatMassPercent: latestExam.bodyFatPct ?? 0,
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
    return data.map((exam) => ({
      date: exam.measuredAt,
      fatMassPercent: exam.bodyFatPct ?? 0,
      muscleMassKg: exam.muscleMassKg ?? 0,
    }));
  },

  async report(): Promise<{ reportUrl: string }> {
    return Promise.resolve({ reportUrl: '/reports/bioimpedance.pdf' });
  },
};
