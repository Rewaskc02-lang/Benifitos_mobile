import { create } from 'zustand';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,

  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, isAuthenticated: false, token: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
