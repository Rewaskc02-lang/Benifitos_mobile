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

export type GraphNodeData = {
  citizenId: string;
  citizenName: string;
  familyId: string | null;
  familyName: string | null;
  stageId: string | null;
  stageName: string | null;
  stateId: string | null;
  stateName: string | null;
  documents: { id: string; name: string; verified: boolean }[];
  schemes: { id: string; name: string; benefit: number; type: string }[];
};

export type PredictionData = {
  schemeName: string;
  benefitAmount: number;
  missingDocuments: string[];
  requiredLifestage: string | null;
};

export const citizenService = {
  /** Fetch full profile + family members for a citizen. */
  getProfile: (citizenId: string) =>
    get<CitizenProfile>(`/api/citizen/${citizenId}`),

  /** Fetch Neo4j graph nodes and relations dataset. */
  getGraphVisual: (citizenId: string) =>
    get<GraphNodeData>(`/api/graph-visual/${citizenId}`),

  /** Fetch predictive eligibility metrics. */
  getPredictiveEligibility: (citizenId: string) =>
    get<{ predictions: PredictionData[] }>(`/api/predictive-eligibility/${citizenId}`),

  /** Fetch family optimizer aggregate recommendations. */
  getFamilyOptimization: (citizenId: string) =>
    get<{
      familyUniverse: {
        familyMember: string;
        age: number;
        activeBenefits: string[];
        optimizedRecommendations: string[];
        potentialExtraValue: number;
      }[];
      householdOptimization: {
        familyName: string;
        totalFamilyIncome: number;
        intergenerationalBonusEligible: boolean;
        familyLevelRecommendations: string[];
      };
    }>(`/api/family-optimizer/${citizenId}`),
};
