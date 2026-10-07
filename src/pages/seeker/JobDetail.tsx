import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, Building2, Loader2, ArrowLeft, CheckCircle2, Briefcase, GraduationCap, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { seekerApi } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';

export default function JobDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, seeker } = useSeekerStore();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const { data: job, isLoading } = useQuery({ queryKey: ['job', id], queryFn: () => seekerApi.getJob(id) });

  const { data: myApps } = useQuery({
    queryKey: ['my-apps-check'],
    queryFn: () => seekerApi.myApplications(),
    enabled: isAuthenticated,
  });
  const alreadyApplied = applied || !!myApps?.some((a) => a.position_id === id);

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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <div className="flex items-start gap-4">
            {job.company_logo
              ? <img src={job.company_logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>}
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{job.title}</h1>
              <p className="text-muted-foreground">{job.company_name || 'Company'}{job.business_unit ? ` · ${job.business_unit}` : ''}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{job.level}</span>
                {job.years_of_experience && <span>{job.years_of_experience} yrs</span>}
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {job.applicant_count} applied</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {alreadyApplied ? (
              <Button disabled className="w-full sm:w-auto"><CheckCircle2 className="mr-2 h-4 w-4" /> Applied</Button>
            ) : (
              <Button onClick={handleApply} disabled={applying} className="w-full gradient-primary sm:w-auto">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply now'}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-6 rounded-2xl border border-border/60 bg-card/50 p-6">
          {job.purpose && (
            <section>
              <h2 className="mb-2 font-semibold">About the role</h2>
              <p className="whitespace-pre-line text-sm text-foreground/80">{job.purpose}</p>
            </section>
          )}
          <Section icon={<ListChecks className="h-4 w-4" />} title="Responsibilities" items={job.responsibilities} />
          <Section icon={<Briefcase className="h-4 w-4" />} title="Experience" items={job.experience} />
          <Section icon={<GraduationCap className="h-4 w-4" />} title="Education" items={job.education} />
          {job.skills?.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => <span key={s} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{s}</span>)}
              </div>
            </section>
          )}
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
      <ul className="space-y-1.5 text-sm text-foreground/80">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {it}</li>)}
      </ul>
    </section>
  );
}
