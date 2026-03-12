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
}
