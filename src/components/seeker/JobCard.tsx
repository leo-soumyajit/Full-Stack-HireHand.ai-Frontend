import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Users, Building2, Bookmark, BookmarkCheck, X, Sparkles, CheckCircle2,
  Clock, Briefcase, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seekerApi, type Job, type MatchBreakdown } from '@/lib/seekerApi';
import { fromDays } from '@/lib/timeago';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';

interface Props {
  job: Job;
  matchPercent?: number;
  reason?: string | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  alreadyApplied?: boolean;
  saved?: boolean;
  daysAgo?: number | null;
  breakdown?: MatchBreakdown | null;
  compact?: boolean;
}

function matchStyle(p?: number) {
  if (p == null) return { pill: 'bg-muted text-muted-foreground border-border', ring: 'border-border/60' };
  if (p >= 75) return { pill: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', ring: 'border-emerald-500/30' };
  if (p >= 55) return { pill: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', ring: 'border-amber-500/30' };
  if (p >= 35) return { pill: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30', ring: 'border-sky-500/30' };
  return { pill: 'bg-slate-500/10 text-slate-500 border-slate-500/30', ring: 'border-border/60' };
}

function barColor(score: number) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 55) return 'bg-amber-500';
  if (score >= 35) return 'bg-sky-500';
  return 'bg-slate-400';
}

export function JobCard(props: Props) {
  const {
    job, matchPercent, reason, matchedSkills = [], missingSkills = [],
    alreadyApplied, saved, daysAgo, breakdown, compact,
  } = props;
  const style = matchStyle(matchPercent);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAuth = useSeekerStore((s) => s.isAuthenticated);
  const [localSaved, setLocalSaved] = useState(!!saved);
  const [hidden, setHidden] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['recommendations'] });
    qc.invalidateQueries({ queryKey: ['saved-jobs'] });
    qc.invalidateQueries({ queryKey: ['profile'] });
  };

  const toggleSave = useMutation({
    mutationFn: () => (localSaved ? seekerApi.unsaveJob(job.id) : seekerApi.saveJob(job.id)),
    onMutate: () => setLocalSaved((s) => !s),
    onError: () => { setLocalSaved((s) => !s); toast({ title: 'Try again', variant: 'destructive' }); },
    onSuccess: () => invalidate(),
  });

  const dismiss = useMutation({
    mutationFn: () => seekerApi.dismissJob(job.id),
    onMutate: () => setHidden(true),
    onError: () => { setHidden(false); toast({ title: 'Try again', variant: 'destructive' }); },
    onSuccess: () => { toast({ title: 'Hidden from recommendations' }); invalidate(); },
  });

  if (hidden) return null;

  // Compact variant for sidebars / "similar jobs" sections
  if (compact) {
    return (
      <Link to={`/jobs/${job.id}`} className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:border-primary/40 hover:shadow-sm">
        {job.company_logo
          ? <img src={job.company_logo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium group-hover:text-primary">{job.title}</p>
          <p className="truncate text-xs text-muted-foreground">{job.company_name || 'Company'} · {job.location}</p>
          {typeof matchPercent === 'number' && (
            <span className={cn('mt-1 inline-block rounded-full border px-1.5 py-0 text-[10px] font-semibold', style.pill)}>{matchPercent}% match</span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className={cn('group relative flex flex-col rounded-2xl border bg-card/50 p-5 transition-all hover:shadow-lg', style.ring)}>
      {/* Top row: logo + title + match pill */}
      <div className="flex items-start gap-3">
        <Link to={`/jobs/${job.id}`}>
          {job.company_logo
            ? <img src={job.company_logo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/jobs/${job.id}`} className="block">
            <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">{job.title}</h3>
            <p className="truncate text-sm text-muted-foreground">{job.company_name || 'Company'}{job.business_unit ? ` · ${job.business_unit}` : ''}</p>
          </Link>
        </div>
        {typeof matchPercent === 'number' && (
          <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold', style.pill)}>
            {matchPercent}%
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
        <span className="rounded-full bg-muted px-2 py-0.5">{job.level}</span>
        {job.years_of_experience && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.years_of_experience}y</span>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fromDays(daysAgo)}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applicant_count} applied</span>
      </div>

      {/* AI reason */}
      {reason && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs leading-relaxed text-foreground/85">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {reason}
        </p>
      )}

      {/* Match breakdown mini-bars */}
      {breakdown && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {([
            ['Skills', breakdown.skills.score],
            ['Match', breakdown.semantic.score],
            ['Exp', breakdown.experience.score],
            ['Title', breakdown.title.score],
            ['Location', breakdown.location.score],
            ['Fresh', breakdown.recency.score],
          ] as [string, number][]).map(([label, score]) => (
            <div key={label} className="space-y-1">
              <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                <span className="truncate">{label}</span>
                <span className="font-semibold text-foreground">{score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', barColor(score))} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills chips */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedSkills.slice(0, 5).map((s) => (
            <span key={`m-${s}`} className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {s}
            </span>
          ))}
          {missingSkills.slice(0, 3).map((s) => (
            <span key={`mi-${s}`} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">+ {s}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        {alreadyApplied ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> Applied
          </span>
        ) : (
          <button
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Apply now
          </button>
        )}
        {isAuth && (
          <>
            <button
              onClick={() => toggleSave.mutate()}
              disabled={toggleSave.isPending}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
              title={localSaved ? 'Unsave' : 'Save for later'}
            >
              {toggleSave.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
               : localSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
              {localSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => dismiss.mutate()}
              disabled={dismiss.isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1.5 text-xs text-muted-foreground hover:border-border/60 hover:text-foreground"
              title="Not interested"
            >
              <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Not interested</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
