/**
 * API response types mirroring the FastAPI Pydantic models.
 * Keep these in sync with backend/models/position.py and candidate.py.
 */

export interface ApiPositionJD {
  purpose: string;
  education: string[];
  experience: string[];
  responsibilities: string[];
  skills: string[];
}

export interface ApiJDVersion {
  version: number;
  jd: ApiPositionJD;
  createdAt: string;
}

export interface ApiL1Question {
  id: string;
  text: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  level?: string; // "L1" | "L2" | "L3" | "L4" | "L5"
}

export interface ApiCustomSectionConfig {
  name: string;
  weight_percentage: number;
}

export interface ApiPositionScreeningRules {
  enabled: boolean;
  sections: ApiCustomSectionConfig[];
  auto_select_threshold: number;
  auto_reject_threshold: number;
}

export interface ApiPosition {
  id: string;
  req_id: string;
  title: string;
  business_unit: string;
  location: string;
  level: string;
  years_of_experience?: string;
  status: string;
  jd?: ApiPositionJD | null;
  jd_versions: ApiJDVersion[];
  l1_questions?: ApiL1Question[];
  screening_rules?: ApiPositionScreeningRules | null;
  candidates_count: number;
  shortlisted_count: number;
  risk_flag?: string | null;
  risk_level?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCandidateScores {
  resume: number;
  psych: number;
  composite: number;
}

export interface ApiCandidate {
  id: string;
  position_id: string;
  name: string;
  role: string;
  email: string;
  stage: string;
  scores: ApiCandidateScores;
  verdict: string;
  added_date: string;
  resume_analysis?: {
    candidate_name: string;
    candidate_email: string;
    candidate_current_role: string;
    social_links?: {
      linkedin?: string | null;
      github?: string | null;
      portfolio?: string | null;
    } | null;
    resume_score: number;
    jd_match_percent: number;
    recommended_stage: string;
    verdict: string;
    strengths: string[];
    gaps: string[];
    verdict_rationale: string;
    experience_summary?: string;
  };
}
