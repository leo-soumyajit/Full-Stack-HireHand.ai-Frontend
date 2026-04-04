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
