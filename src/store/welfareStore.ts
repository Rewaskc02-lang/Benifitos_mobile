import { create } from 'zustand';
import type { WelfareScore, MissedScheme } from '@/lib/api/services/welfareService';

type WelfareState = {
  score: number | null;
  currentBenefits: number | null;
  potentialBenefits: number | null;
  missedSchemes: MissedScheme[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setWelfareScore: (data: WelfareScore) => void;
  setMissedSchemes: (schemes: MissedScheme[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useWelfareStore = create<WelfareState>((set) => ({
  score: null,
  currentBenefits: null,
  potentialBenefits: null,
  missedSchemes: [],
  isLoading: false,
  error: null,

  setWelfareScore: ({ score, currentBenefits, potentialBenefits }) =>
    set({ score, currentBenefits, potentialBenefits }),
  setMissedSchemes: (missedSchemes) => set({ missedSchemes }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      score: null,
      currentBenefits: null,
      potentialBenefits: null,
      missedSchemes: [],
      error: null,
    }),
}));
