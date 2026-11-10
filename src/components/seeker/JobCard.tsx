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

// Flat, professional pill — brand blue for strong, warmer for weaker.
function matchPillClass(p?: number) {
  if (p == null) return 'bg-slate-100 text-slate-600';
  if (p >= 75) return 'bg-[#0369A1] text-white';
  if (p >= 55) return 'bg-sky-100 text-sky-800';
  if (p >= 35) return 'bg-amber-50 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function barColor(score: number) {
  if (score >= 75) return 'bg-[#0369A1]';
  if (score >= 55) return 'bg-sky-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-slate-300';
}

export function JobCard(props: Props) {
  const {
    job, matchPercent, reason, matchedSkills = [], missingSkills = [],
    alreadyApplied, saved, daysAgo, breakdown, compact,
  } = props;
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAuth = useSeekerStore((s) => s.isAuthenticated);
  const [localSaved, setLocalSaved] = useState(!!saved);
  const [hidden, setHidden] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['recommendations'] });
    qc.invalidateQueries({ queryKey: ['recommendations-for-board'] });
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

  // Compact variant — used in "similar jobs" strip
  if (compact) {
    return (
      <Link to={`/jobs/${job.id}`} className="group pro-card flex items-start gap-3 p-3">
        {job.company_logo
          ? <img src={job.company_logo} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-slate-200" />
          : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700"><Building2 className="h-4 w-4" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#0369A1]">{job.title}</p>
          <p className="truncate text-xs text-slate-500">{job.company_name || 'Company'} · {job.location}</p>
          {typeof matchPercent === 'number' && (
            <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold', matchPillClass(matchPercent))}>
              {matchPercent}% match
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="pro-card flex flex-col p-5">
      {/* Top: logo + title + match pill */}
      <div className="flex items-start gap-4">
        <Link to={`/jobs/${job.id}`} className="shrink-0">
          {job.company_logo
            ? <img src={job.company_logo} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" />
            : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <Building2 className="h-6 w-6" />
              </div>}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/jobs/${job.id}`} className="block">
            <h3 className="font-display truncate text-[17px] font-semibold leading-snug text-slate-900 hover:text-[#0369A1]">
              {job.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-600">
              {job.company_name || 'Company'}
              {job.business_unit ? <span className="text-slate-400"> · {job.business_unit}</span> : null}
            </p>
          </Link>
        </div>
        {typeof matchPercent === 'number' && (
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tracking-tight', matchPillClass(matchPercent))}>
            {matchPercent}%
          </span>
        )}
      </div>

      {/* Meta strip */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
        <span className="rounded-md bg-slate-50 px-2 py-0.5 font-medium text-slate-700">{job.level}</span>
        {job.years_of_experience && (
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.years_of_experience}y</span>
        )}
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fromDays(daysAgo)}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applicant_count} applied</span>
      </div>

      {/* AI reason */}
      {reason && (
        <p className="mt-3 flex items-start gap-1.5 rounded-md bg-sky-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0369A1]" /> {reason}
        </p>
      )}

      {/* Breakdown bars */}
      {breakdown && (
        <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6">
          {([
            ['Skills', breakdown.skills.score],
            ['Match', breakdown.semantic.score],
            ['Exp', breakdown.experience.score],
            ['Title', breakdown.title.score],
            ['Location', breakdown.location.score],
            ['Fresh', breakdown.recency.score],
          ] as [string, number][]).map(([label, score]) => (
            <div key={label} className="min-w-0">
              <div className="flex items-baseline justify-between text-[10px] text-slate-500">
                <span className="truncate">{label}</span>
                <span className="font-semibold text-slate-800">{score}</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={cn('h-full rounded-full', barColor(score))} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill chips */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedSkills.slice(0, 5).map((s) => (
            <span key={`m-${s}`} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-3 w-3" /> {s}
            </span>
          ))}
          {missingSkills.slice(0, 3).map((s) => (
            <span key={`mi-${s}`} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
              + {s}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        {alreadyApplied ? (
          <span className="chip-brand inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Applied
          </span>
        ) : (
          <button
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="rounded-full bg-[#0369A1] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0C4A6E]"
          >
            Apply now
          </button>
        )}
        {isAuth && (
          <>
            <button
              onClick={() => toggleSave.mutate()}
              disabled={toggleSave.isPending}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#0369A1]/40 hover:text-[#0369A1]"
            >
              {toggleSave.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
               : localSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-[#0369A1]" /> : <Bookmark className="h-3.5 w-3.5" />}
              {localSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => dismiss.mutate()}
              disabled={dismiss.isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-slate-400 hover:text-slate-700"
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
