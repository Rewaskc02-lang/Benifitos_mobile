import type { RoadmapData } from '@/lib/api/services/roadmapService';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// 🔧 SWAP POINT — to use the real API, replace these two lines:
//   import { roadmapService } from '@/lib/api/services/roadmapService';
//   const fetchFn = (id: string) => roadmapService.getRoadmap(id);
// ---------------------------------------------------------------------------
import { roadmapService } from '@/lib/api/services/roadmapService';
const fetchFn = (citizenId: string) => roadmapService.getRoadmap(citizenId);

// ---------------------------------------------------------------------------

type RoadmapState = {
  data: RoadmapData | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook that fetches the life-stage roadmap for a citizen.
 * Only this file changes when switching from mock to real API.
 */
export function useRoadmap(citizenId: string) {
  const [state, setState] = useState<RoadmapState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetchFn(citizenId);
      setState({ data, isLoading: false, error: null });
    } catch {
      setState({ data: null, isLoading: false, error: 'Failed to load roadmap.' });
    }
  }, [citizenId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refetch();
    });
  }, [refetch]);

  return { ...state, refetch };
}
