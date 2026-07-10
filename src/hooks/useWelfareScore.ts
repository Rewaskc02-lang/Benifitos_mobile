import { useState, useEffect, useCallback } from 'react';
import type { WelfareScore } from '@/lib/api/services/welfareService';
import { welfareService } from '@/lib/api/services/welfareService';

type WelfareScoreState = {
  data: WelfareScore | null;
  isLoading: boolean;
  error: string | null;
};

export function useWelfareScore(citizenId: string) {
  const [state, setState] = useState<WelfareScoreState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!citizenId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await welfareService.getWelfareScore(citizenId);
      setState({ data, isLoading: false, error: null });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Unable to load welfare score. Please check your connection.';
      setState({ data: null, isLoading: false, error: msg });
    }
  }, [citizenId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
