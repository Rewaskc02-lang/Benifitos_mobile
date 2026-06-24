import { useState, useEffect, useCallback } from 'react';
import type { WelfareScore } from '@/lib/api/services/welfareService';

// ---------------------------------------------------------------------------
// 🔧 SWAP POINT — to use the real API, replace these two lines:
//   import { welfareService } from '@/lib/api/services/welfareService';
//   const fetchFn = (id: string) => welfareService.getWelfareScore(id);
// ---------------------------------------------------------------------------
import { mockGetWelfareScore } from '@/lib/api/mockApi';
const fetchFn = (citizenId: string) => mockGetWelfareScore(citizenId);

// ---------------------------------------------------------------------------

type WelfareScoreState = {
  data: WelfareScore | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook that fetches the welfare score for a citizen.
 * The screen component is fully decoupled from the data source —
 * only this file needs to change when switching from mock to real API.
 */
export function useWelfareScore(citizenId: string) {
  const [state, setState] = useState<WelfareScoreState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetchFn(citizenId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      console.log('getWelfareScore error object:', error);
      console.log(
        'getWelfareScore error message:',
        error instanceof Error ? error.message : String(error)
      );
      setState({ data: null, isLoading: false, error: 'Couldn\'t load score' });
    }
  }, [citizenId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
