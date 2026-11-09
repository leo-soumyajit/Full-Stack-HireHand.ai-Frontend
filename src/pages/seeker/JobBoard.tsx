import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Sparkles, Briefcase, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type Job } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';
import { fromDays } from '@/lib/timeago';

const LEVELS = ['Junior', 'Mid', 'Senior', 'Executive'];
const DATE_WINDOWS: { label: string; days: number | null }[] = [
  { label: 'Anytime', days: null },
  { label: 'Past 24 hours', days: 1 },
  { label: 'Past week', days: 7 },
  { label: 'Past month', days: 30 },
];
type SortMode = 'relevance' | 'newest' | 'applicants';

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export default function JobBoard() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [levels, setLevels] = useState<Set<string>>(new Set());
  const [dateWindow, setDateWindow] = useState<number | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>('relevance');
  const [filterOpen, setFilterOpen] = useState(false);

  const isAuth = useSeekerStore((s) => s.isAuthenticated);

  // Pull a wide board then filter client-side (matches LinkedIn pattern)
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', q, location],
    queryFn: () => seekerApi.listJobs({ q: q || undefined, location: location || undefined }),
  });

  // Recommendations (for match% badges on logged-in users)
  const { data: recs } = useQuery({
    queryKey: ['recommendations-for-board'],
    queryFn: () => seekerApi.recommendations({ limit: 50 }),
    enabled: isAuth,
  });
  const recById = useMemo(() => {
    const m = new Map<string, (typeof recs)[number]>();
    recs?.forEach((r) => m.set(r.job.id, r));
    return m;
  }, [recs]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    let xs = jobs as Job[];
    if (levels.size) xs = xs.filter((j) => levels.has(j.level));
    if (remoteOnly) xs = xs.filter((j) => j.location.toLowerCase().includes('remote'));
    if (dateWindow != null) {
      xs = xs.filter((j) => {
        const d = daysSince(j.published_at);
        return d != null ? d <= dateWindow : true;
      });
    }
    if (sort === 'newest') {
      xs = [...xs].sort((a, b) => (new Date(b.published_at || 0).getTime()) - (new Date(a.published_at || 0).getTime()));
    } else if (sort === 'applicants') {
      xs = [...xs].sort((a, b) => b.applicant_count - a.applicant_count);
    } else if (sort === 'relevance' && recById.size) {
      xs = [...xs].sort((a, b) => (recById.get(b.id)?.match_percent || 0) - (recById.get(a.id)?.match_percent || 0));
    }
    return xs;
  }, [jobs, levels, remoteOnly, dateWindow, sort, recById]);

  const clearAll = () => { setLevels(new Set()); setDateWindow(null); setRemoteOnly(false); };

  const toggleLevel = (lvl: string) => {
    const next = new Set(levels);
    next.has(lvl) ? next.delete(lvl) : next.add(lvl);
    setLevels(next);
  };

  const activeCount = levels.size + (dateWindow != null ? 1 : 0) + (remoteOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />

      {/* Hero / Search bar */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Find a job that <span className="text-primary">fits you</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            AI-matched roles from companies hiring right now.
            {!isAuth && <> <Link to="/seeker/signup" className="text-primary font-medium hover:underline">Create a profile</Link> to get personalised recommendations.</>}
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, skill, or company"
                className="w-full rounded-full border border-border/60 bg-background/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                className="w-full rounded-full border border-border/60 bg-background/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <Button className="rounded-full gradient-primary">Search</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {isAuth && (
          <Link to="/seeker/dashboard" className="mb-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <span className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Get personalised Jobs for you</span>
            <Button size="sm" variant="outline" className="rounded-full">Open dashboard →</Button>
          </Link>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* ── Filter sidebar ────────────────── */}
          <aside className={cn('rounded-2xl border border-border/60 bg-card/50 p-4 h-fit lg:sticky lg:top-20',
            filterOpen ? 'block' : 'hidden lg:block')}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Filters {activeCount > 0 && <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{activeCount}</span>}</h3>
              {activeCount > 0 && <button onClick={clearAll} className="text-xs text-primary hover:underline">Clear all</button>}
            </div>

            <FilterBlock title="Experience level">
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => toggleLevel(l)}
                    className={cn('rounded-full border px-3 py-1 text-xs transition-all',
                      levels.has(l) ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/60 hover:border-primary/40')}>
                    {l}
                  </button>
                ))}
              </div>
            </FilterBlock>

            <FilterBlock title="Date posted">
              <div className="space-y-1.5">
                {DATE_WINDOWS.map((d) => (
                  <label key={d.label} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" checked={dateWindow === d.days} onChange={() => setDateWindow(d.days)} className="accent-primary" />
                    {d.label}
                  </label>
                ))}
              </div>
            </FilterBlock>

            <FilterBlock title="Workplace">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="accent-primary" />
                Remote only
              </label>
            </FilterBlock>
          </aside>

          {/* ── Results ────────────────────── */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{isLoading ? 'Loading…' : `${filtered.length} open role${filtered.length !== 1 ? 's' : ''}`}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFilterOpen((o) => !o)}>
                  {filterOpen ? <X className="mr-1 h-3.5 w-3.5" /> : <Filter className="mr-1 h-3.5 w-3.5" />}
                  Filters {activeCount > 0 && `(${activeCount})`}
                </Button>
                <label className="text-xs text-muted-foreground">Sort:</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}
                  className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs outline-none focus:border-primary">
                  <option value="relevance">Best match</option>
                  <option value="newest">Newest</option>
                  <option value="applicants">Most applied</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
                <Briefcase className="mb-3 h-10 w-10 opacity-40" />
                <p>No jobs match your filters. Try adjusting them.</p>
                {activeCount > 0 && <Button onClick={clearAll} variant="outline" size="sm" className="mt-3 rounded-full">Clear filters</Button>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((j) => {
                  const r = recById.get(j.id);
                  return (
                    <JobCard key={j.id} job={j}
                      matchPercent={r?.match_percent}
                      reason={r?.reason}
                      matchedSkills={r?.matched_skills}
                      missingSkills={r?.missing_skills}
                      alreadyApplied={r?.already_applied}
                      saved={r?.saved}
                      daysAgo={r?.days_ago ?? daysSince(j.published_at)}
                      breakdown={r?.breakdown}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/50 py-4 first:border-t-0 first:pt-0">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}
