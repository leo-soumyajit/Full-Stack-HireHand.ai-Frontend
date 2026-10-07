import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Sparkles, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';

const LEVELS = ['', 'Junior', 'Mid', 'Senior', 'Executive'];

export default function JobBoard() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('');
  const [filters, setFilters] = useState<{ q?: string; location?: string; level?: string }>({});
  const isAuth = useSeekerStore((s) => s.isAuthenticated);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => seekerApi.listJobs(filters),
  });

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ q: q || undefined, location: location || undefined, level: level || undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />

      {/* Hero */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Find a job that <span className="text-primary">fits you</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            AI-matched roles from companies hiring right now.
            {!isAuth && <> <Link to="/seeker/signup" className="text-primary font-medium hover:underline">Create a profile</Link> to get personalised recommendations.</>}
          </p>

          <form onSubmit={applyFilters} className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title or keyword"
                className="w-full rounded-xl border border-border/60 bg-background/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                className="w-full rounded-xl border border-border/60 bg-background/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <select value={level} onChange={(e) => setLevel(e.target.value)}
              className="rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-sm outline-none focus:border-primary">
              {LEVELS.map((l) => <option key={l} value={l}>{l || 'All levels'}</option>)}
            </select>
            <Button type="submit" className="gradient-primary">Search</Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {isAuth && (
          <Link to="/seeker/dashboard" className="mb-6 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <span className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> See jobs recommended just for you</span>
            <Button size="sm" variant="outline">View recommendations →</Button>
          </Link>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
            <Briefcase className="mb-3 h-10 w-10 opacity-40" />
            <p>No jobs found. Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{jobs.length} open role{jobs.length !== 1 && 's'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
