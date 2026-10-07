import { Link } from 'react-router-dom';
import { MapPin, Users, Building2, Sparkles } from 'lucide-react';
import type { Job } from '@/lib/seekerApi';

interface Props {
  job: Job;
  matchPercent?: number;
  reason?: string | null;
  matchedSkills?: string[];
  alreadyApplied?: boolean;
}

function matchColor(p: number) {
  if (p >= 75) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  if (p >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
}

export function JobCard({ job, matchPercent, reason, matchedSkills, alreadyApplied }: Props) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/50 p-5 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {typeof matchPercent === 'number' && (
        <span className={`absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${matchColor(matchPercent)}`}>
          {matchPercent}% match
        </span>
      )}

      <div className="flex items-center gap-3">
        {job.company_logo
          ? <img src={job.company_logo} alt="" className="h-11 w-11 rounded-xl object-cover" />
          : <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground group-hover:text-primary">{job.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{job.company_name || 'Company'}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {job.applicant_count} applied</span>
        <span className="rounded-full bg-muted px-2 py-0.5">{job.level}</span>
      </div>

      {reason && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-primary/5 p-2 text-xs text-foreground/80">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {reason}
        </p>
      )}

      {job.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => {
            const hit = matchedSkills?.some((m) => m.toLowerCase() === s.toLowerCase());
            return (
              <span key={s} className={`rounded-md px-2 py-0.5 text-xs ${hit ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </span>
            );
          })}
          {job.skills.length > 5 && <span className="px-1 text-xs text-muted-foreground">+{job.skills.length - 5}</span>}
        </div>
      )}

      {alreadyApplied && (
        <span className="mt-3 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">✓ Applied</span>
      )}
    </Link>
  );
}
