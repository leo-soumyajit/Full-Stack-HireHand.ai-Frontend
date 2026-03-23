/**
 * Email API helper - sends bulk emails
 */
import { apiFetch } from '@/lib/api';

export const emailApi = {
  sendBulkMails: (positionId: string, candidateIds: string[], emailType: 'shortlist' | 'reject') =>
    apiFetch<{ message: string; sent_count: number }>(`/api/positions/${positionId}/candidates/bulk-email`, {
      method: 'POST',
      body: JSON.stringify({ candidate_ids: candidateIds, email_type: emailType }),
    }),
};
