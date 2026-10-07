import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Seeker {
  id: string;
  name: string;
  email: string;
  is_verified?: boolean;
  phone?: string | null;
  headline?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  current_role?: string | null;
  total_experience_years?: number | null;
  summary?: string | null;
  skills?: string[];
  education?: any[];
  work_experience?: any[];
  preferences?: {
    desired_roles?: string[];
    preferred_locations?: string[];
    job_type?: string | null;
    expected_salary?: string | null;
  } | null;
  social_links?: { linkedin?: string | null; github?: string | null; portfolio?: string | null } | null;
  resume_url?: string | null;
  has_resume?: boolean;
  profile_complete?: boolean;
}

interface SeekerAuthState {
  seeker: Seeker | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (seeker: Seeker, token: string) => void;
  setSeeker: (seeker: Seeker) => void;
  logout: () => void;
}

export const SEEKER_STORAGE_KEY = 'hirehand-seeker-storage';

export const useSeekerStore = create<SeekerAuthState>()(
  persist(
    (set) => ({
      seeker: null,
      token: null,
      isAuthenticated: false,
      login: (seeker, token) => set({ seeker, token, isAuthenticated: true }),
      setSeeker: (seeker) => set({ seeker }),
      logout: () => set({ seeker: null, token: null, isAuthenticated: false }),
    }),
    { name: SEEKER_STORAGE_KEY }
  )
);
