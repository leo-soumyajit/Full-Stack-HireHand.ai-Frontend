import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Sparkles, Briefcase, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { JobCard } from '@/components/seeker/JobCard';
import { seekerApi, type Job } from '@/lib/seekerApi';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';

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
  // "For you" means filter the board down to the same relevance-gated
  // recommendations list; "All jobs" shows every published opening.
  const [onlyForYou, setOnlyForYou] = useState(true);

  const isAuth = useSeekerStore((s) => s.isAuthenticated);
  const seeker = useSeekerStore((s) => s.seeker);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', q, location],
    queryFn: () => seekerApi.listJobs({ q: q || undefined, location: location || undefined }),
  });

  const { data: recs } = useQuery({
    queryKey: ['recommendations-for-board'],
    queryFn: () => seekerApi.recommendations({ limit: 50 }),
    enabled: isAuth && !!seeker?.has_resume,
  });
  const recById = useMemo(() => {
    const m = new Map<string, (typeof recs)[number]>();
    recs?.forEach((r) => m.set(r.job.id, r));
    return m;
  }, [recs]);

  const canUseForYou = isAuth && !!seeker?.has_resume && !!recs && recs.length > 0;

  const filtered = useMemo(() => {
    if (!jobs) return [];
    let xs = jobs as Job[];
    if (canUseForYou && onlyForYou) {
      xs = xs.filter((j) => recById.has(j.id));
    }
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
  }, [jobs, levels, remoteOnly, dateWindow, sort, recById, onlyForYou, canUseForYou]);

  const clearAll = () => { setLevels(new Set()); setDateWindow(null); setRemoteOnly(false); };
  const toggleLevel = (lvl: string) => {
    const next = new Set(levels);
    next.has(lvl) ? next.delete(lvl) : next.add(lvl);
    setLevels(next);
  };
  const activeCount = levels.size + (dateWindow != null ? 1 : 0) + (remoteOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <SeekerNav />

      {/* Hero / search */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Find a job that <span className="text-[#0369A1]">fits you</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            AI-matched roles from companies hiring right now.
            {!isAuth && (
              <>{' '}
                <Link to="/seeker/signup" className="font-medium text-[#0369A1] hover:underline">
                  Create a profile
                </Link>{' '}
                to get personalised recommendations.
              </>
            )}
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, skill, or company"
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0369A1]" />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0369A1]" />
            </div>
            <button className="rounded-full bg-[#0369A1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0C4A6E]">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {canUseForYou && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0369A1]/15 bg-[#0369A1]/5 p-4">
            <div className="inline-flex items-center gap-2 text-sm text-[#0369A1]">
              <Sparkles className="h-4 w-4" />
              {onlyForYou
                ? <>Showing only jobs that match your profile — {recs!.length} roles for you</>
                : <>Showing all published roles (unfiltered)</>}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200">
              <button
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  onlyForYou ? 'bg-[#0369A1] text-white' : 'text-slate-600 hover:text-slate-900')}
                onClick={() => setOnlyForYou(true)}>
                For you
              </button>
              <button
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  !onlyForYou ? 'bg-[#0369A1] text-white' : 'text-slate-600 hover:text-slate-900')}
                onClick={() => setOnlyForYou(false)}>
                All jobs
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter sidebar */}
          <aside className={cn('h-fit rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20',
            filterOpen ? 'block' : 'hidden lg:block')}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Filters {activeCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#0369A1]/10 px-2 py-0.5 text-xs text-[#0369A1]">{activeCount}</span>
                )}
              </h3>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-[#0369A1] hover:underline">Clear all</button>
              )}
            </div>

            <FilterBlock title="Experience level">
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => toggleLevel(l)}
                    className={cn('rounded-full border px-3 py-1 text-xs transition-colors',
                      levels.has(l)
                        ? 'border-[#0369A1] bg-[#0369A1]/8 font-semibold text-[#0369A1]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
                    {l}
                  </button>
                ))}
              </div>
            </FilterBlock>

            <FilterBlock title="Date posted">
              <div className="space-y-1.5">
                {DATE_WINDOWS.map((d) => (
                  <label key={d.label} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="radio" checked={dateWindow === d.days} onChange={() => setDateWindow(d.days)}
                      className="h-4 w-4 accent-[#0369A1]" />
                    {d.label}
                  </label>
                ))}
              </div>
            </FilterBlock>

            <FilterBlock title="Workplace">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 accent-[#0369A1]" />
                Remote only
              </label>
            </FilterBlock>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">{isLoading ? 'Loading…' : `${filtered.length} role${filtered.length !== 1 ? 's' : ''}`}</p>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 lg:hidden"
                  onClick={() => setFilterOpen((o) => !o)}>
                  {filterOpen ? <X className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
                  Filters {activeCount > 0 && `(${activeCount})`}
                </button>
                <label className="text-xs text-slate-500">Sort:</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0369A1]">
                  <option value="relevance">Best match</option>
                  <option value="newest">Newest</option>
                  <option value="applicants">Most applied</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#0369A1]" /></div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-20 text-center text-slate-500">
                <Briefcase className="h-10 w-10 opacity-40" />
                <p className="max-w-md px-6 text-sm leading-relaxed">
                  {onlyForYou && canUseForYou
                    ? "No published jobs fit your profile with these filters. Try widening filters or switch to All jobs."
                    : "No jobs match your filters. Try adjusting them."}
                </p>
                {activeCount > 0 && (
                  <button onClick={clearAll} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0369A1]/40">
                    Clear filters
                  </button>
                )}
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
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  );
}
