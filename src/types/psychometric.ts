/**
 * EOS-IA Psychometric Intelligence System — TypeScript Types
 * Mirror of backend/models/psychometric.py
 */

// ── Position-level Profile ─────────────────────────────────────────────────

export interface PsychometricQuestion {
  trait: string;
  question: string;
  why_important: string;
  scoring_guide: string;
}

export interface PsychometricProfile {
  id: string;
  position_id: string;
  role_title: string;
  level: string;
  business_unit: string;
  company_context: string;
  business_model: string;
  role_type: string;
  key_stressors: string[];
  required_traits: PsychometricQuestion[];
  generated_at: string;
}

// ── Candidate Scoring ──────────────────────────────────────────────────────

export interface TraitScore {
  trait: string;
  score: number; // 1–10
  notes?: string;
}

export interface CandidateScoreResponse {
  id: string;
  candidate_id: string;
  position_id: string;
  scores: TraitScore[];
  submitted_at: string;
}

// ── Fitment Report ─────────────────────────────────────────────────────────

export interface TraitInterpretation {
  trait: string;
  score: number;
  interpretation: string;
}

export interface PatternCluster {
  name: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PsychometricRisk {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  statement: string;
  role_specific_risk: string;
}

export interface FitmentVerdict {
  decision: 'GO' | 'CONDITIONAL GO' | 'NO-GO';
  rationale: string;
  coaching_note: string;
}

export interface FitmentReport {
  id: string;
  candidate_id: string;
  position_id: string;
  trait_matrix: TraitInterpretation[];
  pattern_cluster: PatternCluster;
  risk: PsychometricRisk;
  verdict: FitmentVerdict;
  composite_psych_score: number; // 0–100
  generated_at: string;
}
