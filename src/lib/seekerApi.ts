/**
 * Job Seeker portal API client. Separate token store from HR (`hirehand-seeker-storage`).
 */
import { SEEKER_STORAGE_KEY, type Seeker } from '@/store/seekerStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getSeekerToken(): string | null {
  try {
    const raw = localStorage.getItem(SEEKER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

interface Opts extends RequestInit {
  skipAuth?: boolean;
}

export async function seekerFetch<T = unknown>(path: string, options: Opts = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (!skipAuth) {
    const token = getSeekerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, signal: controller.signal });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err.detail || JSON.stringify(err);
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Request timed out — please try again.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Types ──────────────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;
  company_name?: string | null;
  company_logo?: string | null;
  location: string;
  level: string;
  business_unit?: string | null;
  years_of_experience?: string | null;
  purpose: string;
  responsibilities: string[];
  skills: string[];
  education: string[];
  experience: string[];
  published_at?: string | null;
  applicant_count: number;
}

export interface FactorScore {
  score: number;
  weight: number;
  reason?: string | null;
  days_ago?: number | null;
  available?: boolean | null;
}

export interface MatchBreakdown {
  skills: FactorScore;
  semantic: FactorScore;
  experience: FactorScore;
  title: FactorScore;
  location: FactorScore;
  recency: FactorScore;
}

export interface Recommendation {
  job: Job;
  match_percent: number;
  matched_skills: string[];
  missing_skills: string[];
  reason?: string | null;
  already_applied: boolean;
  saved: boolean;
  days_ago?: number | null;
  breakdown?: MatchBreakdown | null;
}

export interface ProfileStrengthTip {
  field: string;
  label: string;
  points: number;
}

export interface ProfileStrength {
  percent: number;
  tips: ProfileStrengthTip[];
  missing: ProfileStrengthTip[];
}

export interface Application {
  id: string;
  position_id: string;
  job_title: string;
  company_name?: string | null;
  company_logo?: string | null;
  location?: string | null;
  status: string;
  match_percent?: number | null;
  applied_at: string;
}

export interface SeekerTokenResponse {
  access_token: string;
  token_type: string;
  seeker: Seeker;
}

// ── API ────────────────────────────────────────────────────────────
export const seekerApi = {
  // auth
  signup: (name: string, email: string, password: string) =>
    seekerFetch<{ need_verification: boolean; email: string }>('/api/seeker/auth/signup', {
      method: 'POST', skipAuth: true, body: JSON.stringify({ name, email, password }),
    }),
  verifyOtp: (email: string, otp: string) =>
    seekerFetch<SeekerTokenResponse>('/api/seeker/auth/verify-otp', {
      method: 'POST', skipAuth: true, body: JSON.stringify({ email, otp }),
    }),
  resendOtp: (email: string) =>
    seekerFetch<{ message: string }>('/api/seeker/auth/resend-otp', {
      method: 'POST', skipAuth: true, body: JSON.stringify({ email }),
    }),
  login: (email: string, password: string) =>
    seekerFetch<SeekerTokenResponse>('/api/seeker/auth/login', {
      method: 'POST', skipAuth: true, body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    seekerFetch<{ message: string }>('/api/seeker/auth/forgot-password', {
      method: 'POST', skipAuth: true, body: JSON.stringify({ email }),
    }),

  // profile
  getProfile: () => seekerFetch<Seeker>('/api/seeker/profile'),
  updateProfile: (patch: Partial<Seeker>) =>
    seekerFetch<Seeker>('/api/seeker/profile', { method: 'PUT', body: JSON.stringify(patch) }),
  uploadResume: (fileBase64: string, filename: string) =>
    seekerFetch<{ profile: Seeker; parsed: boolean }>('/api/seeker/profile/resume', {
      method: 'POST', body: JSON.stringify({ file_base64: fileBase64, filename }),
    }),
  uploadAvatar: (fileBase64: string) =>
    seekerFetch<{ url: string }>('/api/seeker/profile/avatar', {
      method: 'POST', body: JSON.stringify({ file_base64: fileBase64 }),
    }),

  // jobs (public)
  listJobs: (params: { q?: string; location?: string; level?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.location) qs.set('location', params.location);
    if (params.level) qs.set('level', params.level);
    const query = qs.toString();
    return seekerFetch<Job[]>(`/api/jobs${query ? `?${query}` : ''}`, { skipAuth: true });
  },
  getJob: (id: string) => seekerFetch<Job>(`/api/jobs/${id}`, { skipAuth: true }),

  // applications
  apply: (positionId: string, coverNote?: string) =>
    seekerFetch<Application>('/api/seeker/applications', {
      method: 'POST', body: JSON.stringify({ position_id: positionId, cover_note: coverNote }),
    }),
  myApplications: () => seekerFetch<Application[]>('/api/seeker/applications'),

  // recommendations
  recommendations: (params: { limit?: number; minScore?: number; includeSaved?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.minScore) qs.set('min_score', String(params.minScore));
    if (params.includeSaved === false) qs.set('include_saved', 'false');
    const q = qs.toString();
    return seekerFetch<Recommendation[]>(`/api/seeker/recommendations${q ? `?${q}` : ''}`);
  },
  savedJobs: () => seekerFetch<Recommendation[]>('/api/seeker/saved-jobs'),
  similarJobs: (jobId: string, limit = 6) =>
    seekerFetch<Recommendation[]>(`/api/seeker/similar-jobs/${jobId}?limit=${limit}`),

  // profile strength
  profileStrength: () => seekerFetch<ProfileStrength>('/api/seeker/profile/strength'),

  // save / dismiss
  saveJob: (jobId: string): Promise<{ saved: boolean; job_id: string }> =>
    seekerFetch(`/api/seeker/jobs/${jobId}/save`, { method: 'POST' }),
  unsaveJob: (jobId: string): Promise<{ saved: boolean; job_id: string }> =>
    seekerFetch(`/api/seeker/jobs/${jobId}/save`, { method: 'DELETE' }),
  dismissJob: (jobId: string): Promise<{ dismissed: boolean; job_id: string }> =>
    seekerFetch(`/api/seeker/jobs/${jobId}/dismiss`, { method: 'POST' }),
};
