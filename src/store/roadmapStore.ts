import { create } from 'zustand';

export type RoadmapPhase = {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  phase: number;
  completedAt?: string;
};

type RoadmapState = {
  phases: RoadmapPhase[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setPhases: (phases: RoadmapPhase[]) => void;
  updatePhaseStatus: (id: string, status: RoadmapPhase['status']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useRoadmapStore = create<RoadmapState>((set) => ({
  phases: [],
  isLoading: false,
  error: null,

  setPhases: (phases) => set({ phases }),
  updatePhaseStatus: (id, status) =>
    set((state) => ({
      phases: state.phases.map((phase) =>
        phase.id === id ? { ...phase, status } : phase
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
