import type { MissedBenefits } from '@/lib/api/services/welfareService';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// 🔧 SWAP POINT — to use the real API, replace these two lines:
//   import { welfareService } from '@/lib/api/services/welfareService';
//   const fetchFn = (id: string) => welfareService.getMissedBenefits(id);
// ---------------------------------------------------------------------------
import { welfareService } from '@/lib/api/services/welfareService';
const fetchFn = (citizenId: string) => welfareService.getMissedBenefits(citizenId);

// ---------------------------------------------------------------------------

type MissedBenefitsState = {
  data: MissedBenefits | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook that fetches missed benefit schemes for a citizen.
 * The screen is fully decoupled from the data source — only this file
 * needs to change when switching from mock to real API.
 */
export function useMissedBenefits(citizenId: string) {
  const [state, setState] = useState<MissedBenefitsState>({
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
      setState({ data: null, isLoading: false, error: 'Failed to load missed benefits.' });
    }
  }, [citizenId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
