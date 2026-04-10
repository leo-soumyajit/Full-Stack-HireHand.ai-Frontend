import { apiFetch } from "./api";

export interface ApiSchedule {
  id: string;
  candidate_id: string;
  position_id: string;
  user_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_role: string;
  position_title: string;
  scheduled_at: string;
  meeting_link: string;
  room_id?: string;
  interview_round: number;
  status: string;
  created_at: string;
}

export const schedulesApi = {
  create: async (candidateId: string, positionId: string, scheduledAtISO: string): Promise<ApiSchedule> => {
    return apiFetch<ApiSchedule>("/api/schedules", {
      method: "POST",
      body: JSON.stringify({
        candidate_id: candidateId,
        position_id: positionId,
        scheduled_at: scheduledAtISO,
      }),
    });
  },

  list: async (): Promise<ApiSchedule[]> => {
    return apiFetch<ApiSchedule[]>("/api/schedules");
  },

  updateStatus: async (scheduleId: string, status: "Scheduled" | "Completed" | "Cancelled"): Promise<ApiSchedule> => {
    return apiFetch<ApiSchedule>(`/api/schedules/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
