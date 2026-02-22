import { create } from 'zustand';

interface PatientState {
  selectedPatientId: string | null;
  filters: {
    search: string;
    hasPendingLabs: boolean;
  };
  setSelectedPatientId: (patientId: string | null) => void;
  updateSearch: (search: string) => void;
  togglePendingLabs: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  selectedPatientId: null,
  filters: {
    search: '',
    hasPendingLabs: false,
  },
  setSelectedPatientId: (patientId) => set({ selectedPatientId: patientId }),
  updateSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  togglePendingLabs: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        hasPendingLabs: !state.filters.hasPendingLabs,
      },
    })),
}));
