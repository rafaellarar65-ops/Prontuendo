import { create } from 'zustand';
import type { AuthTokens, UserProfile } from '@/types/api';

interface AuthState {
  tokens: AuthTokens | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (tokens: AuthTokens, user: UserProfile) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  tokens: null,
  user: null,
  isAuthenticated: false,
  signIn: (tokens, user) => set({ tokens, user, isAuthenticated: true }),
  signOut: () => set({ tokens: null, user: null, isAuthenticated: false }),
}));
