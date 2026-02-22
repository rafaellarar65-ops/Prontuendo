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
