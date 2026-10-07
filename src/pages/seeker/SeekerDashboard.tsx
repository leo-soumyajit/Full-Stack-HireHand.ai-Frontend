import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, Briefcase, Building2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type Application } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';

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
    queryFn: () => seekerApi.recommendations(),
    enabled: !!seeker?.has_resume,
  });
  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => seekerApi.myApplications(),
  });

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Hi {seeker?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="text-sm text-muted-foreground">{seeker?.headline || 'Your personalised job hub'}</p>
          </div>
          <Link to="/seeker/onboarding"><Button variant="outline" size="sm"><FileText className="mr-1 h-4 w-4" /> Edit profile</Button></Link>
        </div>

        {!seeker?.has_resume && (
          <Link to="/seeker/onboarding" className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Upload your resume to unlock AI recommendations</p>
              <p className="text-xs text-muted-foreground">We match you to roles based on your skills & experience.</p>
            </div>
            <Button size="sm" className="gradient-primary">Complete profile</Button>
          </Link>
        )}

        <Tabs defaultValue="recommendations">
          <TabsList>
            <TabsTrigger value="recommendations"><Sparkles className="mr-1 h-4 w-4" /> Jobs for you</TabsTrigger>
            <TabsTrigger value="applications"><Briefcase className="mr-1 h-4 w-4" /> My applications{apps?.length ? ` (${apps.length})` : ''}</TabsTrigger>
          </TabsList>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="mt-6">
            {!seeker?.has_resume ? (
              <EmptyState icon={<Sparkles />} text="Upload your resume to see jobs matched to you." cta />
            ) : recsLoading ? (
              <Loading />
            ) : !recs || recs.length === 0 ? (
              <EmptyState icon={<Briefcase />} text="No published jobs match yet. Check back soon or browse all jobs." cta />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.map((r) => (
                  <JobCard key={r.job.id} job={r.job} matchPercent={r.match_percent}
                    reason={r.reason} matchedSkills={r.matched_skills} alreadyApplied={r.already_applied} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications" className="mt-6">
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
    </div>
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
      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[app.status] || 'bg-muted text-muted-foreground'}`}>{app.status}</span>
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
