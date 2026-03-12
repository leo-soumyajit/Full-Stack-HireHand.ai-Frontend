/**
 * resumeApi.ts — AI Resume Screening API helper
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function getToken(): string {
  try {
    const raw = localStorage.getItem('hirehand-auth-storage');
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? "";
  } catch {
    return "";
  }
}

export interface ResumeAnalysis {
  candidate_name: string;
  candidate_email: string | null;
  candidate_current_role: string | null;
  resume_score: number;        // 0-10
  jd_match_percent: number;    // 0-100
  strengths: string[];
  gaps: string[];
  experience_summary: string;
  verdict: "STRONG FIT" | "POTENTIAL FIT" | "WEAK FIT" | "NOT SUITABLE";
  verdict_rationale: string;
  recommended_stage: string;
}

export interface ResumeScreenResponse {
  analysis: ResumeAnalysis;
  candidate_id: string | null;
  position_id: string;
  raw_text_length: number;
}

export async function screenResume(
  positionId: string,
  fileBase64: string,   // pre-computed base64, read immediately on file selection
  filename: string,
  autoAdd: boolean = true,
): Promise<ResumeScreenResponse> {
  const res = await fetch(`${BASE_URL}/positions/${positionId}/screen-resume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_base64: fileBase64,
      filename,
      auto_add: autoAdd,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Resume screening failed");
  }
  return res.json();
}

