import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Loader2, Briefcase, Building2, AlertCircle, FileText, Bookmark,
  TrendingUp, Zap, Target, ArrowRight, Check,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type Application } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  'Under review': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Shortlisted': 'bg-sky-50 text-sky-800 ring-sky-200',
  'Interview': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'Selected': 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  'Not selected': 'bg-red-50 text-red-800 ring-red-200',
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
    <div className="min-h-screen bg-[#F7FAFC]">
      <SeekerNav />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Welcome hero */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {seeker?.avatar_url
                ? <img src={seeker.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200" />
                : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0369A1]/8 text-xl font-bold text-[#0369A1]">
                    {seeker?.name?.[0]?.toUpperCase() || '?'}
                  </div>}
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Hi {seeker?.name?.split(' ')[0] || 'there'} 👋
                </h1>
                <p className="mt-0.5 text-sm text-slate-600">{seeker?.headline || seeker?.current_role || 'Your personalised job hub'}</p>
              </div>
            </div>
            <Link to="/seeker/onboarding"
              className="inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-[#0369A1]/40 hover:text-[#0369A1] sm:self-auto">
              <FileText className="h-4 w-4" /> Edit profile
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Sparkles />} label="New matches" value={newToday} tone="brand" />
            <StatCard icon={<Target />} label="Top matches" value={topMatches.length} tone="sky" />
            <StatCard icon={<Briefcase />} label="Applications" value={apps?.length || 0} tone="amber" />
            <StatCard icon={<Zap />} label="In progress" value={interviewCount} tone="emerald" />
          </div>
        </section>

        {/* Feed + rail */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {!seeker?.has_resume && <ResumeNudge />}

            <Tabs defaultValue="recommendations">
              <TabsList className="mb-4 bg-white ring-1 ring-slate-200">
                <TabsTrigger value="recommendations"><Sparkles className="mr-1 h-4 w-4" /> Jobs for you</TabsTrigger>
                <TabsTrigger value="saved"><Bookmark className="mr-1 h-4 w-4" /> Saved{saved?.length ? ` (${saved.length})` : ''}</TabsTrigger>
                <TabsTrigger value="applications"><Briefcase className="mr-1 h-4 w-4" /> Applications{apps?.length ? ` (${apps.length})` : ''}</TabsTrigger>
              </TabsList>

              <TabsContent value="recommendations">
                {!seeker?.has_resume ? (
                  <EmptyState icon={<Sparkles />} text="Upload your resume to unlock AI matches." cta />
                ) : recsLoading ? (
                  <Loading />
                ) : !recs || recs.length === 0 ? (
                  <EmptyState icon={<Briefcase />} text="No matches that fit your profile yet. We only show roles relevant to your skills. Try adding more skills or come back when new jobs are posted." cta />
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

              <TabsContent value="saved">
                {!saved || saved.length === 0 ? (
                  <EmptyState icon={<Bookmark />} text="Jobs you save will appear here. Tap the bookmark icon on any job to save it." cta />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {saved.map((r) => (
                      <JobCard key={r.job.id} job={r.job} matchPercent={r.match_percent}
                        matchedSkills={r.matched_skills} missingSkills={r.missing_skills}
                        alreadyApplied={r.already_applied} saved daysAgo={r.days_ago}
                        breakdown={r.breakdown} />
                    ))}
                  </div>
                )}
              </TabsContent>

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

          <aside className="space-y-4">
            {/* Profile strength */}
            {strength && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-slate-900">Profile strength</h3>
                  <span className={cn('text-xs font-bold',
                    strength.percent >= 80 ? 'text-emerald-600' : strength.percent >= 50 ? 'text-amber-600' : 'text-red-600')}>
                    {strength.percent}%
                  </span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full transition-[width] duration-500',
                    strength.percent >= 80 ? 'bg-emerald-500' : strength.percent >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${strength.percent}%` }} />
                </div>
                {strength.tips.length > 0 ? (
                  <>
                    <p className="mb-2 text-xs text-slate-500">Quick wins:</p>
                    <ul className="space-y-2">
                      {strength.tips.map((t) => (
                        <li key={t.field} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-700">{t.label}</span>
                          <span className="chip-brand rounded-full px-2 py-0.5 text-[10px] font-bold">+{t.points}%</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/seeker/onboarding">
                      <button className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#0369A1]/40 hover:text-[#0369A1]">
                        Complete profile <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </>
                ) : (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> All set — you're attracting more matches
                  </p>
                )}
              </div>
            )}

            {skillGaps.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-1 flex items-center gap-1.5 font-display text-sm font-semibold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-[#0369A1]" /> Skills to add
                </h3>
                <p className="mb-3 text-xs text-slate-500">Learning these unlocks more matches:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillGaps.map((g) => (
                    <span key={g.skill} className="chip-brand rounded-md px-2 py-1 text-xs font-medium">
                      {g.skill} <span className="opacity-60">×{g.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-[#0369A1] p-5 text-white">
              <h3 className="font-display font-semibold">Browse all jobs</h3>
              <p className="mt-1 text-xs opacity-90">Explore every open role, with filters.</p>
              <Link to="/jobs">
                <button className="mt-3 w-full rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#0369A1] hover:bg-slate-50">
                  Open job board
                </button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'brand' | 'emerald' | 'sky' | 'amber' }) {
  const toneMap = {
    brand: 'bg-[#0369A1]/8 text-[#0369A1]',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5', toneMap[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="font-display text-xl font-bold leading-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ResumeNudge() {
  return (
    <Link to="/seeker/onboarding"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900">Upload your resume to unlock AI recommendations</p>
        <p className="text-xs text-amber-800/80">We match you to roles based on your skills & experience.</p>
      </div>
      <span className="rounded-full bg-[#0369A1] px-3 py-1.5 text-xs font-semibold text-white">Complete profile</span>
    </Link>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  return (
    <Link to={`/jobs/${app.position_id}`}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#0369A1]/40">
      {app.company_logo
        ? <img src={app.company_logo} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200" />
        : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><Building2 className="h-5 w-5" /></div>}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{app.job_title}</p>
        <p className="truncate text-sm text-slate-500">{app.company_name || 'Company'}{app.location ? ` · ${app.location}` : ''}</p>
      </div>
      {typeof app.match_percent === 'number' && <span className="hidden text-sm text-slate-500 sm:block">{app.match_percent}% match</span>}
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', STATUS_STYLE[app.status] || 'bg-slate-50 text-slate-700 ring-slate-200')}>
        {app.status}
      </span>
    </Link>
  );
}

function Loading() { return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#0369A1]" /></div>; }

function EmptyState({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
      <div className="opacity-40 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      <p className="max-w-md text-sm leading-relaxed">{text}</p>
      {cta && <Link to="/jobs" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-[#0369A1]/40 hover:text-[#0369A1]">Browse all jobs</Link>}
    </div>
  );
}
