import { useCallback, useEffect, useState } from 'react';
import type { MissedBenefits } from '@/lib/api/services/welfareService';
import { welfareService } from '@/lib/api/services/welfareService';

type State = {
  data: MissedBenefits | null;
  isLoading: boolean;
  error: string | null;
};

export function useMissedBenefits(citizenId: string) {
  const [state, setState] = useState<State>({ data: null, isLoading: true, error: null });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await welfareService.getMissedBenefits(citizenId);
      setState({ data, isLoading: false, error: null });
    } catch {
      setState({ data: null, isLoading: false, error: 'Failed to load missed benefits.' });
    }
  }, [citizenId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
