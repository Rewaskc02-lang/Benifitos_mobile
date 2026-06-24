import { post } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssistantRequest = {
  question: string;
  citizenId?: string;
};

export type AssistantResponse = {
  answer: string;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const assistantService = {
  /**
   * Send a question to the AI assistant and receive an answer.
   */
  ask: (payload: AssistantRequest) =>
    post<AssistantResponse, AssistantRequest>('/api/assistant', payload),
};
