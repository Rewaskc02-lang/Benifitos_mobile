import { get } from '@/lib/api/client';

export type FamilyMember = {
  name: string;
  age: number | null;
  relationship: string;
  lifeStage: string;
};

export type CitizenProfile = {
  id: string;
  name: string;
  age: number | null;
  income: number | null;
  state: string | null;
  lifeStage: string;
  family: FamilyMember[];
};

export const citizenService = {
  /** Fetch full profile + family members for a citizen. */
  getProfile: (citizenId: string) =>
    get<CitizenProfile>(`/api/citizen/${citizenId}`),
};
