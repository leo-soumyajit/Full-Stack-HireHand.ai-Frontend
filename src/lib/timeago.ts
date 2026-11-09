/** "2 days ago" style formatting. Accepts days_ago int from backend or an ISO date. */
export function fromDays(days: number | null | undefined): string {
  if (days == null) return 'Recently';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function fromISO(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return fromDays(days);
}
