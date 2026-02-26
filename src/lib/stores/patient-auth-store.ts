import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthTokens } from '@/types/api';

interface PatientSession {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  roles: string[];
  patientId?: string;
}

interface PatientAuthState {
  tokens: AuthTokens | null;
  patient: PatientSession | null;
  isAuthenticated: boolean;
  signIn: (tokens: AuthTokens, patient: PatientSession) => void;
  signOut: () => void;
}

export const usePatientAuthStore = create<PatientAuthState>()(
  persist(
    (set) => ({
      tokens: null,
      patient: null,
      isAuthenticated: false,
      signIn: (tokens, patient) => set({ tokens, patient, isAuthenticated: true }),
      signOut: () => set({ tokens: null, patient: null, isAuthenticated: false }),
    }),
    {
      name: 'prontuendo-patient-auth',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
