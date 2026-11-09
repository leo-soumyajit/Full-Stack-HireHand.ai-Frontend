import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Users, Building2, Loader2, ArrowLeft, CheckCircle2, Briefcase,
  GraduationCap, ListChecks, Bookmark, BookmarkCheck, Clock, Share2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type MatchBreakdown } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';
import { fromDays, fromISO } from '@/lib/timeago';
import { cn } from '@/lib/utils';

function barColor(score: number) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 55) return 'bg-amber-500';
  if (score >= 35) return 'bg-sky-500';
  return 'bg-slate-400';
}

export default function JobDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAuthenticated, seeker } = useSeekerStore();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const { data: job, isLoading } = useQuery({ queryKey: ['job', id], queryFn: () => seekerApi.getJob(id) });
  const { data: myApps } = useQuery({
    queryKey: ['my-apps-check'],
    queryFn: () => seekerApi.myApplications(),
    enabled: isAuthenticated,
  });
  const { data: similar } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => seekerApi.similarJobs(id, 4),
    enabled: isAuthenticated,
  });
  // Pull this job from recommendations to get match data (cheap because reco is cached)
  const { data: recs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => seekerApi.recommendations({ limit: 50 }),
    enabled: isAuthenticated,
  });
  const rec = recs?.find((r) => r.job.id === id);
  const breakdown: MatchBreakdown | null | undefined = rec?.breakdown;

  const alreadyApplied = applied || !!myApps?.some((a) => a.position_id === id);
  const [localSaved, setLocalSaved] = useState<boolean | undefined>(undefined);
  const saved = localSaved ?? rec?.saved ?? false;

  const toggleSave = useMutation({
    mutationFn: () => (saved ? seekerApi.unsaveJob(id) : seekerApi.saveJob(id)),
    onMutate: () => setLocalSaved(!saved),
    onError: () => setLocalSaved(saved),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recommendations'] }); qc.invalidateQueries({ queryKey: ['saved-jobs'] }); },
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: job?.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied' }); }
    } catch { /* ignore */ }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in to apply', description: 'Create a profile to apply in one click.' });
      navigate('/seeker/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    if (!seeker?.has_resume) {
      toast({ title: 'Upload your resume first', description: 'Complete your profile, then apply.' });
      navigate('/seeker/onboarding');
      return;
    }
    setApplying(true);
    try {
      await seekerApi.apply(id);
      setApplied(true);
      toast({ title: 'Application sent! 🎉', description: 'Track it from your dashboard.' });
      qc.invalidateQueries({ queryKey: ['my-apps-check'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Try again';
      if (msg.toLowerCase().includes('already')) { setApplied(true); toast({ title: 'Already applied' }); }
      else toast({ title: 'Could not apply', description: msg, variant: 'destructive' });
    } finally { setApplying(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-background"><SeekerNav /><div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></div>;
  if (!job) return <div className="min-h-screen bg-background"><SeekerNav /><div className="py-32 text-center text-muted-foreground">Job not found. <Link to="/jobs" className="text-primary hover:underline">Browse jobs</Link></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Main column ──────────────── */}
          <div className="space-y-6">
            {/* Hero card */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
              <div className="flex items-start gap-4">
                {job.company_logo
                  ? <img src={job.company_logo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Building2 className="h-7 w-7 text-primary" /></div>}
                <div className="flex-1">
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1>
                  <p className="mt-0.5 text-muted-foreground">{job.company_name || 'Company'}{job.business_unit ? ` · ${job.business_unit}` : ''}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{job.level}</span>
                    {job.years_of_experience && <span>{job.years_of_experience} yrs</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{fromISO(job.published_at)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{job.applicant_count} applied</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {alreadyApplied ? (
                  <Button disabled className="rounded-full"><CheckCircle2 className="mr-2 h-4 w-4" /> Applied</Button>
                ) : (
                  <Button onClick={handleApply} disabled={applying} className="rounded-full gradient-primary">
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply now'}
                  </Button>
                )}
                {isAuthenticated && (
                  <Button variant="outline" className="rounded-full" onClick={() => toggleSave.mutate()} disabled={toggleSave.isPending}>
                    {toggleSave.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      : saved ? <BookmarkCheck className="mr-1 h-4 w-4 text-primary" /> : <Bookmark className="mr-1 h-4 w-4" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                )}
                <Button variant="outline" className="rounded-full" onClick={share}>
                  <Share2 className="mr-1 h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            {/* Body sections */}
            <div className="space-y-6 rounded-2xl border border-border/60 bg-card/50 p-6">
              {job.purpose && (
                <section>
                  <h2 className="mb-2 font-semibold">About the role</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{job.purpose}</p>
                </section>
              )}
              <Section icon={<ListChecks className="h-4 w-4" />} title="What you'll do" items={job.responsibilities} />
              <Section icon={<Briefcase className="h-4 w-4" />} title="Experience you'll bring" items={job.experience} />
              <Section icon={<GraduationCap className="h-4 w-4" />} title="Education" items={job.education} />
              {job.skills?.length > 0 && (
                <section>
                  <h2 className="mb-2 font-semibold">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => {
                      const hit = rec?.matched_skills.some((m) => m.toLowerCase() === s.toLowerCase());
                      return (
                        <span key={s} className={cn('rounded-md px-2.5 py-1 text-xs font-medium',
                          hit ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-primary/10 text-primary')}>
                          {hit && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Similar jobs */}
            {similar && similar.length > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card/50 p-6">
                <h2 className="mb-3 font-semibold">Similar roles you might like</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {similar.map((r) => (
                    <JobCard key={r.job.id} job={r.job} matchPercent={r.match_percent}
                      matchedSkills={r.matched_skills} missingSkills={r.missing_skills}
                      alreadyApplied={r.already_applied} saved={r.saved} daysAgo={r.days_ago}
                      compact />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right rail: match breakdown ──────────── */}
          <aside className="space-y-4 lg:sticky lg:top-20 h-fit">
            {rec ? (
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Your match</h3>
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{rec.match_percent}%</span>
                </div>
                {rec.reason && <p className="mb-4 text-sm leading-relaxed text-foreground/85">{rec.reason}</p>}

                {breakdown && (
                  <div className="space-y-2.5">
                    {([
                      ['Skills match', breakdown.skills.score, undefined],
                      ['Semantic fit', breakdown.semantic.score, breakdown.semantic.available ? undefined : 'AI off'],
                      ['Experience', breakdown.experience.score, breakdown.experience.reason],
                      ['Title relevance', breakdown.title.score, breakdown.title.reason],
                      ['Location', breakdown.location.score, breakdown.location.reason],
                      ['Posted', breakdown.recency.score, fromDays(breakdown.recency.days_ago)],
                    ] as [string, number, string | undefined][]).map(([label, score, note]) => (
                      <div key={label}>
                        <div className="mb-1 flex items-baseline justify-between text-xs">
                          <span className="text-foreground/80">{label}</span>
                          <span className="font-semibold text-foreground">{score}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full transition-all', barColor(score))} style={{ width: `${score}%` }} />
                        </div>
                        {note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {rec.missing_skills.length > 0 && (
                  <div className="mt-4 border-t border-border/40 pt-3">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Skills to close the gap:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.missing_skills.slice(0, 5).map((s) => (
                        <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs">+ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !isAuthenticated ? (
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5">
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <h3 className="font-semibold">See your match score</h3>
                <p className="mt-1 text-xs text-muted-foreground">Sign in to see how well you match this role.</p>
                <Link to="/seeker/login" state={{ from: { pathname: `/jobs/${id}` } }}>
                  <Button size="sm" className="mt-3 w-full rounded-full gradient-primary">Sign in</Button>
                </Link>
              </div>
            ) : null}

            {/* About company */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Building2 className="h-4 w-4 text-primary" /> About the company</h3>
              <p className="text-sm font-medium">{job.company_name || 'Company'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{job.location}{job.business_unit ? ` · ${job.business_unit}` : ''}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-semibold">{icon} {title}</h2>
      <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/85">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" /> {it}</li>)}
      </ul>
    </section>
  );
}
