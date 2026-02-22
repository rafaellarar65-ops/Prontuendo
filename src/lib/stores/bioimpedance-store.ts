import { create } from 'zustand';

type BioimpedanceStep = 'upload' | 'preview' | 'confirmation' | 'dashboard';

interface BioimpedanceState {
  currentStep: BioimpedanceStep;
  uploadedFileName: string | null;
  setStep: (step: BioimpedanceStep) => void;
  setUploadedFileName: (fileName: string | null) => void;
  resetFlow: () => void;
}

export const useBioimpedanceStore = create<BioimpedanceState>((set) => ({
  currentStep: 'upload',
  uploadedFileName: null,
  setStep: (step) => set({ currentStep: step }),
  setUploadedFileName: (fileName) => set({ uploadedFileName: fileName }),
  resetFlow: () => set({ currentStep: 'upload', uploadedFileName: null }),
}));
