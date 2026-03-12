/**
 * Production-level authenticated API client.
 * Automatically injects the JWT Bearer token from Zustand's auth store.
 * All API calls go through this helper so we never scatter token logic.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('hirehand-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || JSON.stringify(err);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ── Positions ──────────────────────────────────────────────────────────────

export const positionsApi = {
  list: (status?: string) =>
    apiFetch<import('@/types/api').ApiPosition[]>(
      `/api/positions${status ? `?status_filter=${status}` : ''}`
    ),

  create: (body: { title: string; business_unit: string; location: string; level: string; years_of_experience?: string }) =>
    apiFetch<import('@/types/api').ApiPosition>('/api/positions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{ title: string; business_unit: string; location: string; level: string }>) =>
    apiFetch<import('@/types/api').ApiPosition>(`/api/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  setStatus: (id: string, status: 'Active' | 'Closed') =>
    apiFetch<import('@/types/api').ApiPosition>(`/api/positions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  saveJD: (id: string, jd: object, version: number) =>
    apiFetch<import('@/types/api').ApiPosition>(`/api/positions/${id}/jd`, {
      method: 'PATCH',
      body: JSON.stringify({ jd, version }),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/positions/${id}`, { method: 'DELETE' }),
};

// ── Candidates ─────────────────────────────────────────────────────────────

export const candidatesApi = {
  list: (positionId: string) =>
    apiFetch<import('@/types/api').ApiCandidate[]>(`/api/positions/${positionId}/candidates`),

  add: (positionId: string, body: { name: string; role: string; email: string; stage: string }) =>
    apiFetch<import('@/types/api').ApiCandidate>(`/api/positions/${positionId}/candidates`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (candidateId: string, body: { stage?: string; verdict?: string }) =>
    apiFetch<import('@/types/api').ApiCandidate>(`/api/positions/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (candidateId: string) =>
    apiFetch<void>(`/api/positions/candidates/${candidateId}`, { method: 'DELETE' }),
};
