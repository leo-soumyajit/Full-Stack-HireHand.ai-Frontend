/**
 * EOS-IA Psychometric API helper — all calls go through apiFetch with JWT
 */
import { apiFetch } from '@/lib/api';
import type {
  PsychometricProfile,
  TraitScore,
  CandidateScoreResponse,
  FitmentReport,
} from '@/types/psychometric';

const BASE = '/api/psychometric';

export const psychometricApi = {
  // ── Profile ────────────────────────────────────────────────────────────
  generateProfile: (positionId: string) =>
    apiFetch<PsychometricProfile>(`${BASE}/positions/${positionId}/psychometric-profile`, {
      method: 'POST',
    }),

  getProfile: (positionId: string) =>
    apiFetch<PsychometricProfile>(`${BASE}/positions/${positionId}/psychometric-profile`),

  // ── Scores ─────────────────────────────────────────────────────────────
  submitScores: (candidateId: string, scores: TraitScore[]) =>
    apiFetch<CandidateScoreResponse>(`${BASE}/candidates/${candidateId}/psychometric-score`, {
      method: 'POST',
      body: JSON.stringify({ scores }),
    }),

  getScores: (candidateId: string) =>
    apiFetch<CandidateScoreResponse>(`${BASE}/candidates/${candidateId}/psychometric-score`),

  // ── Report ─────────────────────────────────────────────────────────────
  generateReport: (candidateId: string) =>
    apiFetch<FitmentReport>(`${BASE}/candidates/${candidateId}/psychometric-report`, {
      method: 'POST',
    }),

  getReport: (candidateId: string) =>
    apiFetch<FitmentReport>(`${BASE}/candidates/${candidateId}/psychometric-report`),
};
