import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number | null;
  income?: number | null;
  state?: string | null;
  stage?: string | null;
  lifeStage?: string | null;
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
  setToken: (token) => {
    SecureStore.setItemAsync('auth_token', token).catch(err => {
      console.warn('Failed to save secure store auth token:', err);
    });
    set({ token });
  },
  logout: () => {
    SecureStore.deleteItemAsync('auth_token').catch(err => {
      console.warn('Failed to delete secure store auth token:', err);
    });
    set({ user: null, isAuthenticated: false, token: null });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
