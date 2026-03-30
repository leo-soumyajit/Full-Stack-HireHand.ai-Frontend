import { Question } from "@/types/questions";
import { PositionJD } from "@/types/positions";
import { ApiL1Question } from "@/types/api";
import { apiFetch } from "@/lib/api";

export async function generateQuestionsFromJD(jobDescription: string): Promise<Question[]> {
  try {
    const data = await apiFetch<{ questions: Question[] }>('/api/ai/generate-questions-from-jd', {
      method: "POST",
      body: JSON.stringify({ job_description: jobDescription })
    });
    return data.questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

export async function enhanceJDWithAI(rawJD: string, existingJD?: PositionJD): Promise<PositionJD> {
  try {
    const data = await apiFetch<PositionJD>('/api/ai/enhance-jd', {
      method: "POST",
      body: JSON.stringify({ raw_jd: rawJD, existing_jd: existingJD })
    });
    return data;
  } catch (error) {
    console.error("Error enhancing JD:", error);
    throw error;
  }
}

export async function enhanceFullJDWithAI(rawJD: string): Promise<PositionJD> {
  try {
    const data = await apiFetch<PositionJD>('/api/ai/enhance-full-jd', {
      method: "POST",
      body: JSON.stringify({ raw_jd: rawJD })
    });
    return data;
  } catch (error) {
    console.error("Error enhancing full JD:", error);
    throw error;
  }
}

export const INTERVIEW_LEVELS = ["L1", "L2", "L3", "L4", "L5"] as const;
export type InterviewLevel = typeof INTERVIEW_LEVELS[number];

export const INTERVIEW_CATEGORIES = [
  "Technical",
  "Behavioral",
  "Problem Solving",
  "Aptitude",
  "Managerial",
  "Communication",
  "Cultural Fit",
  "Leadership",
  "Domain Knowledge",
  "System Design",
  "Math & Logical",
] as const;
export type InterviewCategory = typeof INTERVIEW_CATEGORIES[number];

interface GenerateInterviewQuestionsParams {
  jobDescription: string;
  role: string;
  level: InterviewLevel;
  category: string;
  counts: { easy: number; medium: number; hard: number };
  existingQuestions?: ApiL1Question[];
}

export async function generateInterviewQuestions({
  jobDescription,
  role,
  level,
  category,
  counts,
  existingQuestions,
}: GenerateInterviewQuestionsParams): Promise<ApiL1Question[]> {
  try {
    const data = await apiFetch<{ questions: ApiL1Question[] }>('/api/ai/generate-interview', {
      method: "POST",
      body: JSON.stringify({
        job_description: jobDescription,
        role,
        level,
        category,
        counts,
        existing_questions: existingQuestions
      })
    });
    return data.questions;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw error;
  }
}

/** @deprecated Use generateInterviewQuestions instead */
export async function generateL1Questions(
  jobDescription: string,
  role: string,
  counts: { easy: number; medium: number; hard: number }
): Promise<ApiL1Question[]> {
  return generateInterviewQuestions({ jobDescription, role, level: "L1", category: "Technical", counts });
}
