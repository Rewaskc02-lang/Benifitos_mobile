import { create } from 'zustand';

export type AppTheme = 'dark' | 'light' | 'system';

type AppState = {
  theme: AppTheme;
  isOnboarded: boolean;
  isSidebarOpen: boolean;

  // Actions
  setTheme: (theme: AppTheme) => void;
  setOnboarded: (value: boolean) => void;
  toggleSidebar: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  isOnboarded: false,
  isSidebarOpen: false,

  setTheme: (theme) => set({ theme }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
