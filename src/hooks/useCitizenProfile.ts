import { useState, useEffect, useCallback } from 'react';
import { citizenService, CitizenProfile } from '@/lib/api/services/citizenService';

export function useCitizenProfile(citizenId: string) {
  const [data, setData] = useState<CitizenProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!citizenId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await citizenService.getProfile(citizenId);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [citizenId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
