import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UiState {
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  theme: 'system',
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
}));
