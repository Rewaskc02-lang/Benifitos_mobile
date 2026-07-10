import { useCallback, useEffect, useState } from 'react';
import type { RoadmapData } from '@/lib/api/services/roadmapService';
import { roadmapService } from '@/lib/api/services/roadmapService';

type State = {
  data: RoadmapData | null;
  isLoading: boolean;
  error: string | null;
};

export function useRoadmap(citizenId: string) {
  const [state, setState] = useState<State>({ data: null, isLoading: true, error: null });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await roadmapService.getRoadmap(citizenId);
      setState({ data, isLoading: false, error: null });
    } catch {
      setState({ data: null, isLoading: false, error: 'Failed to load roadmap.' });
    }
  }, [citizenId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
