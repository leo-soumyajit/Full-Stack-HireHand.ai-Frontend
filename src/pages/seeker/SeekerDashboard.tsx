import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Loader2, Briefcase, Building2, AlertCircle, FileText, Bookmark,
  TrendingUp, Zap, Target, ArrowRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type Application } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  'Under review': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Shortlisted': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Interview': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  'Selected': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Not selected': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
};

export default function SeekerDashboard() {
  const seeker = useSeekerStore((s) => s.seeker);

  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => seekerApi.recommendations({ limit: 25 }),
    enabled: !!seeker?.has_resume,
  });
  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => seekerApi.myApplications(),
  });
  const { data: saved } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => seekerApi.savedJobs(),
    enabled: !!seeker?.has_resume,
  });
  const { data: strength } = useQuery({
    queryKey: ['profile-strength'],
    queryFn: () => seekerApi.profileStrength(),
  });

  // Derived: top skills to add (aggregated from top missing_skills across recs)
  const skillGaps = useMemo(() => {
    if (!recs) return [];
    const counts = new Map<string, number>();
    recs.slice(0, 15).forEach((r) =>
      r.missing_skills.slice(0, 3).forEach((s) => counts.set(s, (counts.get(s) || 0) + 1))
    );
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, n]) => ({ skill: s, count: n }));
  }, [recs]);

  const topMatches = recs?.filter((r) => !r.already_applied) || [];
  const newToday = recs?.filter((r) => (r.days_ago ?? 99) <= 1).length || 0;
  const interviewCount = apps?.filter((a) => a.status === 'Interview' || a.status === 'Shortlisted').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* ── Welcome hero ───────────────────────────────── */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {seeker?.avatar_url
                ? <img src={seeker.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-md" />
                : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">{seeker?.name?.[0]?.toUpperCase() || '?'}</div>}
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {seeker?.name?.split(' ')[0] || 'there'} 👋</h1>
                <p className="text-sm text-muted-foreground">{seeker?.headline || seeker?.current_role || 'Your personalised job hub'}</p>
              </div>
            </div>
            <Link to="/seeker/onboarding"><Button variant="outline" className="rounded-full"><FileText className="mr-1 h-4 w-4" /> Edit profile</Button></Link>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Sparkles />} label="New matches" value={newToday} tone="emerald" />
            <StatCard icon={<Target />} label="Top matches" value={topMatches.length} tone="primary" />
            <StatCard icon={<Briefcase />} label="Applications" value={apps?.length || 0} tone="sky" />
            <StatCard icon={<Zap />} label="In progress" value={interviewCount} tone="amber" />
          </div>
        </div>

        {/* ── Main grid: feed + side rail ────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: tabs */}
          <div>
            {!seeker?.has_resume && <ResumeNudge />}

            <Tabs defaultValue="recommendations">
              <TabsList className="mb-4">
                <TabsTrigger value="recommendations"><Sparkles className="mr-1 h-4 w-4" /> Jobs for you</TabsTrigger>
                <TabsTrigger value="saved"><Bookmark className="mr-1 h-4 w-4" /> Saved{saved?.length ? ` (${saved.length})` : ''}</TabsTrigger>
                <TabsTrigger value="applications"><Briefcase className="mr-1 h-4 w-4" /> Applications{apps?.length ? ` (${apps.length})` : ''}</TabsTrigger>
              </TabsList>

              {/* Recommendations */}
              <TabsContent value="recommendations">
                {!seeker?.has_resume ? (
                  <EmptyState icon={<Sparkles />} text="Upload your resume to unlock AI matches." cta />
                ) : recsLoading ? (
                  <Loading />
                ) : !recs || recs.length === 0 ? (
                  <EmptyState icon={<Briefcase />} text="No matches yet — new jobs are posted every day. Check back soon." cta />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recs.map((r) => (
                      <JobCard key={r.job.id} job={r.job} matchPercent={r.match_percent}
                        reason={r.reason} matchedSkills={r.matched_skills} missingSkills={r.missing_skills}
                        alreadyApplied={r.already_applied} saved={r.saved} daysAgo={r.days_ago}
                        breakdown={r.breakdown} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Saved */}
              <TabsContent value="saved">
                {!saved || saved.length === 0 ? (
                  <EmptyState icon={<Bookmark />} text="Jobs you save will appear here. Tap the bookmark icon on any job to save it." cta />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {saved.map((r) => (
                      <JobCard key={r.job.id} job={r.job} matchPercent={r.match_percent}
                        matchedSkills={r.matched_skills} missingSkills={r.missing_skills}
                        alreadyApplied={r.already_applied} saved={true} daysAgo={r.days_ago}
                        breakdown={r.breakdown} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Applications */}
              <TabsContent value="applications">
                {appsLoading ? <Loading /> : !apps || apps.length === 0 ? (
                  <EmptyState icon={<Briefcase />} text="You haven't applied to any jobs yet." cta />
                ) : (
                  <div className="space-y-3">
                    {apps.map((a) => <ApplicationRow key={a.id} app={a} />)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            {/* Profile strength */}
            {strength && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Profile strength</h3>
                  <span className={cn('text-xs font-bold', strength.percent >= 80 ? 'text-emerald-500' : strength.percent >= 50 ? 'text-amber-500' : 'text-red-500')}>
                    {strength.percent}%
                  </span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      strength.percent >= 80 ? 'bg-emerald-500' : strength.percent >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                {strength.tips.length > 0 ? (
                  <>
                    <p className="mb-2 text-xs text-muted-foreground">Quick wins:</p>
                    <ul className="space-y-2">
                      {strength.tips.map((t) => (
                        <li key={t.field} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-foreground/80">{t.label}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">+{t.points}%</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/seeker/onboarding">
                      <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">
                        Complete profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> All set — you're attracting more matches
                  </p>
                )}
              </div>
            )}

            {/* Skill gap suggestions */}
            {skillGaps.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Skills to add</h3>
                <p className="mb-3 text-xs text-muted-foreground">Learning these unlocks more matches:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillGaps.map((g) => (
                    <span key={g.skill} className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
                      {g.skill} <span className="text-primary/60">×{g.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA card */}
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-5">
              <h3 className="font-semibold">Browse all jobs</h3>
              <p className="mt-1 text-xs text-muted-foreground">Explore every open role, with filters.</p>
              <Link to="/jobs"><Button size="sm" className="mt-3 w-full rounded-full gradient-primary">Open job board</Button></Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'primary' | 'emerald' | 'sky' | 'amber' }) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5', toneMap[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ResumeNudge() {
  return (
    <Link to="/seeker/onboarding" className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <AlertCircle className="h-5 w-5 text-amber-500" />
      <div className="flex-1">
        <p className="text-sm font-medium">Upload your resume to unlock AI recommendations</p>
        <p className="text-xs text-muted-foreground">We match you to roles based on your skills & experience.</p>
      </div>
      <Button size="sm" className="gradient-primary">Complete profile</Button>
    </Link>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  return (
    <Link to={`/jobs/${app.position_id}`} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/40">
      {app.company_logo
        ? <img src={app.company_logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
        : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{app.job_title}</p>
        <p className="truncate text-sm text-muted-foreground">{app.company_name || 'Company'}{app.location ? ` · ${app.location}` : ''}</p>
      </div>
      {typeof app.match_percent === 'number' && <span className="hidden text-sm text-muted-foreground sm:block">{app.match_percent}% match</span>}
      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[app.status] || 'bg-muted text-muted-foreground border-border/60')}>{app.status}</span>
    </Link>
  );
}

function Loading() { return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function EmptyState({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <div className="opacity-40 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      <p className="max-w-sm text-sm">{text}</p>
      {cta && <Link to="/jobs"><Button variant="outline" size="sm">Browse all jobs</Button></Link>}
    </div>
  );
}
