import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  company_name: string;
  company_domain?: string | null;
  company_logo?: string | null;
  email: string;
  position?: string | null;
  phone_code?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  // RBAC
  role?: string;
  org_id?: string | null;
}

// ── RBAC Helpers ──
export type UserRole = 'owner' | 'admin' | 'manager' | 'interviewer' | 'viewer';

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  interviewer: 2,
  viewer: 1,
};

/** Check if a user's role meets or exceeds the minimum required role */
export function hasMinRole(userRole: string | undefined, minRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole || 'owner'] ?? 5) >= (ROLE_HIERARCHY[minRole] ?? 99);
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'hirehand-auth-storage', // unique name
    }
  )
);
