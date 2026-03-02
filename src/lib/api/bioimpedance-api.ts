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
  examDate: string;
  hydrationPercent: number;
  muscleMassKg: number;
  fatMassPercent: number;
  sourceFileName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const bioimpedanceApi = {
  async list(patientId: string): Promise<BioimpedanceExam[]> {
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance', {
      params: { patientId },
    });
    return data;
  },

  async create(
    dto: Omit<BioimpedanceExam, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  ): Promise<BioimpedanceExam> {
    const { data } = await http.post<BioimpedanceExam>('/bioimpedance', dto);
    return data;
  },

  async upload(fileName: string): Promise<BioimpedanceUpload> {
    return Promise.resolve({ fileName, uploadedAt: new Date().toISOString(), status: 'uploaded' });
  },

  async aiPreview(): Promise<BioimpedanceAiPreview> {
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance');
    const latestExam = data[0];

    if (!latestExam) {
      return {
        hydrationPercent: 0,
        muscleMassKg: 0,
        fatMassPercent: 0,
        flags: [],
      };
    }

    return {
      hydrationPercent: latestExam.hydrationPercent,
      muscleMassKg: latestExam.muscleMassKg,
      fatMassPercent: latestExam.fatMassPercent,
      flags: [],
    };
  },

  async confirm(): Promise<{ success: true }> {
    return Promise.resolve({ success: true });
  },

  async evolution(): Promise<BioimpedancePoint[]> {
    const { data } = await http.get<BioimpedanceExam[]>('/bioimpedance');
    return data.map((exam) => ({
      date: exam.examDate,
      fatMassPercent: exam.fatMassPercent,
      muscleMassKg: exam.muscleMassKg,
    }));
  },

  async report(): Promise<{ reportUrl: string }> {
    return Promise.resolve({ reportUrl: '/reports/bioimpedance.pdf' });
  },
};
