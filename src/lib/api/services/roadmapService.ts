import { get } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Types — matches GET /api/roadmap/:citizenId contract
// ---------------------------------------------------------------------------

export type RoadmapData = {
  currentStage: string;
  nextStage: string;
  opportunities: string[];
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const roadmapService = {
  /**
   * Fetch the roadmap for a citizen.
   */
  getRoadmap: (citizenId: string) =>
    get<RoadmapData>(`/api/roadmap/${citizenId}`),
};
