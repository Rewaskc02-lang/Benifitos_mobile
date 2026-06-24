/**
 * mockApi.ts
 *
 * Drop-in mock for the real API services.
 * Every function matches the exact signature of its real counterpart in
 * src/lib/api/services/ so that swapping later requires changing only one
 * import in the consuming hook — no screen changes needed.
 *
 * Data shapes are taken verbatim from CONTRACTS.md.
 */

import axios from 'axios';
import type { WelfareScore, MissedBenefits } from '@/lib/api/services/welfareService';
import type { RoadmapData } from '@/lib/api/services/roadmapService';
import type { AssistantResponse, AssistantRequest } from '@/lib/api/services/assistantService';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://api.benefitos.com';
const TEST_CITIZEN_ID = 'citizen_101';

// ---------------------------------------------------------------------------
// GET /api/welfare-score/:citizenId
// ---------------------------------------------------------------------------
export const mockGetWelfareScore = async (_citizenId: string): Promise<WelfareScore> => {
  const baseUrl = API_URL.replace(/\/$/, '');
  const response = await axios.get<WelfareScore>(
    `${baseUrl}/api/welfare-score/${TEST_CITIZEN_ID}`
  );

  return response.data;
};

// ---------------------------------------------------------------------------
// GET /api/missed-benefits/:citizenId
// ---------------------------------------------------------------------------
export const mockGetMissedBenefits = async (_citizenId: string): Promise<MissedBenefits> => {
  await delay(1100);
  return {
    missedSchemes: [
      {
        id: 'sch-1092',
        name: 'Post-Matric Scholarship Scheme X',
        benefitAmount: 20000,
        reason:
          'Income falls below 2.5 LPA threshold but registration relationship missing.',
      },
      {
        id: 'sch-2041',
        name: 'State Startup Seed Capital Grant',
        benefitAmount: 15000,
        reason:
          'Business registered under MSME but Aadhaar has not been linked to the firm account.',
      },
      {
        id: 'sch-3187',
        name: 'Pradhan Mantri Awas Yojana Subsidy',
        benefitAmount: 30000,
        reason:
          'Household income qualifies but no active housing loan is linked to your profile.',
      },
    ],
  };
};

// ---------------------------------------------------------------------------
// GET /api/roadmap/:citizenId
// ---------------------------------------------------------------------------
export const mockGetRoadmap = async (_citizenId: string): Promise<RoadmapData> => {
  await delay(800);
  return {
    currentStage: 'Student',
    nextStage: 'Graduate',
    opportunities: [
      'State Startup Seed Capital Grant',
      'MSME Equipment Credit Support Scheme',
    ],
  };
};

// ---------------------------------------------------------------------------
// POST /api/assistant
// ---------------------------------------------------------------------------
export const mockAskAssistant = async (
  _payload: AssistantRequest
): Promise<AssistantResponse> => {
  await delay(1400);
  return {
    answer:
      'Based on your household profiling, your family qualifies for 3 additional state-backed agrarian schemes.',
  };
};
