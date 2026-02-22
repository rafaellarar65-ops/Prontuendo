import type {
  BioimpedanceAiPreview,
  BioimpedancePoint,
  BioimpedanceUpload,
} from '@/types/bioimpedance';

const mockEvolution: BioimpedancePoint[] = [
  { date: '2026-01-10', fatMassPercent: 34.2, muscleMassKg: 24.5 },
  { date: '2026-01-24', fatMassPercent: 33.1, muscleMassKg: 24.8 },
  { date: '2026-02-07', fatMassPercent: 31.9, muscleMassKg: 25.4 },
];

export const bioimpedanceApi = {
  async upload(fileName: string): Promise<BioimpedanceUpload> {
    return Promise.resolve({ fileName, uploadedAt: new Date().toISOString(), status: 'uploaded' });
  },
  async aiPreview(): Promise<BioimpedanceAiPreview> {
    return Promise.resolve({
      hydrationPercent: 53.1,
      muscleMassKg: 25.4,
      fatMassPercent: 31.9,
      flags: ['Hidratação adequada', 'Boa evolução de massa magra'],
    });
  },
  async confirm(): Promise<{ success: true }> {
    return Promise.resolve({ success: true });
  },
  async evolution(): Promise<BioimpedancePoint[]> {
    return Promise.resolve(mockEvolution);
  },
  async report(): Promise<{ reportUrl: string }> {
    return Promise.resolve({ reportUrl: '/reports/bioimpedance-2026-02-07.pdf' });
  },
};
