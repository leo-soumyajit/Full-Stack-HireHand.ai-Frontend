import { apiFetch } from "./api";

export interface InterviewAnalysisListItem {
  id: string;
  schedule_id: string;
  candidate_id: string;
  candidate_name: string;
  position_title: string;
  status: "processing" | "completed" | "failed";
  duration_seconds: number;
  created_at: string;
  overall_score?: number | null;
  verdict?: string | null;
}

export interface InterviewAnalysisFull extends InterviewAnalysisListItem {
  position_id: string;
  candidate_id: string;
  transcript: string;
  parsed_transcript?: any;
  competency_analysis?: any;
  interviewer_report?: any;
  candidate_report?: any;
  interviewer_quality?: any;
  error?: string | null;
  tab_switch_count?: number;
}

export const interviewIntelligenceApi = {
  endInterview: async (scheduleId: string, transcript: string, durationSeconds: number, tabSwitchCount: number = 0) => {
    return apiFetch<{ id: string; status: string; message: string }>("/api/interview-intelligence/end-interview", {
      method: "POST",
      body: JSON.stringify({
        schedule_id: scheduleId,
        transcript,
        duration_seconds: durationSeconds,
        tab_switch_count: tabSwitchCount,
      }),
    });
  },

  listForPosition: async (positionId: string): Promise<InterviewAnalysisListItem[]> => {
    return apiFetch<InterviewAnalysisListItem[]>(`/api/interview-intelligence/position/${positionId}`);
  },

  getAnalysis: async (analysisId: string): Promise<InterviewAnalysisFull> => {
    return apiFetch<InterviewAnalysisFull>(`/api/interview-intelligence/${analysisId}`);
  },

  deleteAnalysis: async (analysisId: string): Promise<void> => {
    return apiFetch<void>(`/api/interview-intelligence/${analysisId}`, { method: "DELETE" });
  },

  retryAnalysis: async (analysisId: string): Promise<{ id: string; status: string; message: string }> => {
    return apiFetch<{ id: string; status: string; message: string }>(`/api/interview-intelligence/retry/${analysisId}`, { method: "POST" });
  },
};
