/**
 * useRoleAccess — Centralized RBAC hook for UI permission gating.
 * Returns boolean flags for each action category.
 * 
 * This is the SINGLE SOURCE OF TRUTH for frontend permission checks.
 * Components import this hook and conditionally render buttons/actions.
 */

import { useAuthStore, hasMinRole, type UserRole } from '@/store/authStore';

export function useRoleAccess() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role || 'owner') as UserRole;

  return {
    role,
    // ── Position Actions ──
    canCreatePosition: hasMinRole(role, 'manager'),
    canEditPosition: hasMinRole(role, 'manager'),
    canDeletePosition: hasMinRole(role, 'admin'),

    // ── Candidate Actions ──
    canManageCandidates: hasMinRole(role, 'manager'),

    // ── Assessment Actions ──
    canGenerateAssessment: hasMinRole(role, 'manager'),
    canSendAssessment: hasMinRole(role, 'manager'),

    // ── Interview Actions ──
    canConductInterview: hasMinRole(role, 'interviewer'),
    canScorePsychometrics: hasMinRole(role, 'interviewer'),

    // ── Scheduling ──
    canManageSchedules: hasMinRole(role, 'manager'),

    // ── Resume Screening ──
    canScreenResumes: hasMinRole(role, 'manager'),

    // ── Reports ──
    canGenerateReports: hasMinRole(role, 'manager'),

    // ── Team Management ──
    canManageTeam: hasMinRole(role, 'admin'),

    // ── Config & Profile ──
    canEditConfig: hasMinRole(role, 'admin'),

    // ── JD / AI Tools ──
    canUseAITools: hasMinRole(role, 'manager'),

    // ── Generic ──
    isViewerOnly: role === 'viewer',
    isInterviewerOnly: role === 'interviewer',
  };
}
