import { get } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WelfareScore = {
  score: number;
  currentBenefits: number;
  potentialBenefits: number;
};

export type MissedScheme = {
  id: string;
  name: string;
  benefitAmount: number;
  reason: string;
};

export type MissedBenefits = {
  missedSchemes: MissedScheme[];
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const welfareService = {
  /**
   * Fetch the welfare score for a citizen.
   */
  getWelfareScore: (citizenId: string) =>
    get<WelfareScore>(`/api/welfare-score/${citizenId}`),

  /**
   * Fetch missed benefit schemes for a citizen.
   */
  getMissedBenefits: (citizenId: string) =>
    get<MissedBenefits>(`/api/missed-benefits/${citizenId}`),
};
