/**
 * usePositions — central data hook replacing all localStorage calls.
 * All mutations are optimistic: UI updates instantly, then syncs to DB.
 * All queries use the user-scoped backend API.
 */

import { useState, useEffect, useCallback } from 'react';
import { positionsApi, candidatesApi } from '@/lib/api';
import { ApiPosition, ApiCandidate, ApiPositionJD, ApiL1Question } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export type { ApiPosition as Position, ApiCandidate as Candidate, ApiL1Question as L1Question };

interface UsePositionsReturn {
  positions: ApiPosition[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPosition: (data: { title: string; business_unit: string; location: string; level: string }) => Promise<ApiPosition>;
  updatePosition: (id: string, data: Partial<{ title: string; business_unit: string; location: string; level: string }>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  setPositionStatus: (id: string, status: 'Active' | 'Closed') => Promise<void>;
  saveJD: (positionId: string, jd: ApiPositionJD, version: number) => Promise<void>;
  saveL1Questions: (positionId: string, questions: ApiL1Question[]) => Promise<void>;
  getCandidates: (positionId: string) => Promise<ApiCandidate[]>;
  addCandidate: (positionId: string, data: { name: string; role: string; email: string; stage: string }) => Promise<ApiCandidate>;
  updateCandidate: (candidateId: string, data: { stage?: string; verdict?: string }) => Promise<void>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  setCandidatesCount: (positionId: string, count: number) => void;
}

export function usePositions(): UsePositionsReturn {
  const [positions, setPositions] = useState<ApiPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await positionsApi.list();
      setPositions(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load positions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const createPosition = useCallback(async (data: { title: string; business_unit: string; location: string; level: string }) => {
    const newPos = await positionsApi.create(data);
    setPositions(prev => [newPos, ...prev]);
    return newPos;
  }, []);

  const updatePosition = useCallback(async (id: string, data: Partial<{ title: string; business_unit: string; location: string; level: string }>) => {
    const updated = await positionsApi.update(id, data);
    setPositions(prev => prev.map(p => p.id === id ? updated : p));
  }, []);

  const deletePosition = useCallback(async (id: string) => {
    // Optimistic remove
    setPositions(prev => prev.filter(p => p.id !== id));
    try {
      await positionsApi.delete(id);
    } catch (err) {
      // Rollback
      await fetchPositions();
      toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
      throw err;
    }
  }, [fetchPositions, toast]);

  const setPositionStatus = useCallback(async (id: string, status: 'Active' | 'Closed') => {
    // Optimistic update
    setPositions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    try {
      const updated = await positionsApi.setStatus(id, status);
      setPositions(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      await fetchPositions();
      throw err;
    }
  }, [fetchPositions]);

  const saveJD = useCallback(async (positionId: string, jd: ApiPositionJD, version: number) => {
    const updated = await positionsApi.saveJD(positionId, jd, version);
    setPositions(prev => prev.map(p => p.id === positionId ? updated : p));
  }, []);

  const saveL1Questions = useCallback(async (positionId: string, questions: ApiL1Question[]) => {
    const updated = await positionsApi.saveL1Questions(positionId, questions);
    setPositions(prev => prev.map(p => p.id === positionId ? updated : p));
  }, []);

  const getCandidates = useCallback(async (positionId: string) => {
    return candidatesApi.list(positionId);
  }, []);

  const addCandidate = useCallback(async (positionId: string, data: { name: string; role: string; email: string; stage: string }) => {
    const candidate = await candidatesApi.add(positionId, data);
    // Update candidates_count in local state
    setPositions(prev => prev.map(p =>
      p.id === positionId
        ? { ...p, candidates_count: p.candidates_count + 1 }
        : p
    ));
    return candidate;
  }, []);

  const updateCandidate = useCallback(async (candidateId: string, data: { stage?: string; verdict?: string }) => {
    await candidatesApi.update(candidateId, data);
  }, []);

  const deleteCandidate = useCallback(async (candidateId: string) => {
    await candidatesApi.delete(candidateId);
  }, []);

  const setCandidatesCount = useCallback((positionId: string, count: number) => {
    setPositions(prev => prev.map(p => p.id === positionId ? { ...p, candidates_count: count } : p));
  }, []);

  return {
    positions,
    isLoading,
    error,
    refetch: fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
    setPositionStatus,
    saveJD,
    saveL1Questions,
    getCandidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    setCandidatesCount,
  };
}
