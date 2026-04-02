/**
 * AllCandidatesView — shows ALL candidates across all positions for the current user.
 * Fetches positions list, then lazily loads candidates per position on expand.
 */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MainLoader } from "@/components/ui/main-loader";
import { usePositions } from "@/hooks/usePositions";
import { ApiCandidate } from "@/types/api";

const STAGE_COLORS: Record<string, string> = {
  "Sourced": "bg-muted text-muted-foreground border-border/50",
  "Screened": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Interview L1": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Interview L2": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "Offer": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Rejected": "bg-red-500/15 text-red-400 border-red-500/30",
};
const VERDICT_COLORS: Record<string, string> = {
  "Go": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Conditional": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "CONDITIONAL GO": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "No-Go": "bg-red-500/15 text-red-400 border-red-500/30",
  "NO-GO": "bg-red-500/15 text-red-400 border-red-500/30",
  "Pending": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

interface AllCandidatesViewProps {
  onViewCandidate?: (positionId: string, candidateId: string) => void;
}

export function AllCandidatesView({ onViewCandidate }: AllCandidatesViewProps) {
  const { positions, isLoading, getCandidates } = usePositions();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [candidatesMap, setCandidatesMap] = useState<Record<string, ApiCandidate[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Auto-expand and load candidates for the first position
  useEffect(() => {
    if (positions.length > 0 && Object.keys(expanded).length === 0) {
      const firstId = positions[0].id;
      setExpanded({ [firstId]: true });
      loadCandidates(firstId);
    }
  }, [positions]);

  const loadCandidates = async (positionId: string) => {
    if (candidatesMap[positionId] !== undefined) return; // already loaded
    setLoadingMap(prev => ({ ...prev, [positionId]: true }));
    try {
      const data = await getCandidates(positionId);
      setCandidatesMap(prev => ({ ...prev, [positionId]: data }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const toggleExpand = (positionId: string) => {
    const next = !expanded[positionId];
    setExpanded(prev => ({ ...prev, [positionId]: next }));
    if (next) loadCandidates(positionId);
  };

  // Flattened list for search across all positions
  const allCandidates = useMemo(() => {
    const list: (ApiCandidate & { positionTitle: string; positionId: string })[] = [];
    for (const pos of positions) {
      for (const c of candidatesMap[pos.id] ?? []) {
        list.push({ ...c, positionTitle: pos.title, positionId: pos.id });
      }
    }
    return list;
  }, [positions, candidatesMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allCandidates.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    );
  }, [search, allCandidates]);

  const totalCandidates = positions.reduce((s, p) => s + p.candidates_count, 0);

  if (isLoading) {
    return (
      <div className="py-20">
        <MainLoader text="Loading candidates..." />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Candidates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalCandidates} total · across {positions.length} positions</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:border-primary"
          />
        </div>
      </motion.div>

      {/* Search Results overlay */}
      {filtered !== null && (
        <motion.div variants={item}>
          <Card className="glass-strong overflow-hidden">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">No candidates match "{search}"</div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onViewCandidate?.(c.positionId, c.id)}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-border/20 last:border-0 hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">{getInitials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.role} · {c.positionTitle}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs hidden sm:flex ${STAGE_COLORS[c.stage] || STAGE_COLORS["Sourced"]}`}>{c.stage}</Badge>
                    <Badge variant="outline" className={`text-xs ${VERDICT_COLORS[c.verdict] || VERDICT_COLORS["Pending"]}`}>{c.verdict}</Badge>
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${c.scores.composite >= 85 ? 'bg-emerald-400' : c.scores.composite >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(c.scores.composite, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${c.scores.composite >= 85 ? "text-emerald-400" : c.scores.composite >= 70 ? "text-yellow-400" : "text-red-400"}`}>{c.scores.composite}%</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Positions accordion */}
      {!filtered && positions.length === 0 && (
        <Card className="glass-strong">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold font-display">No positions yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create a position first to start adding candidates.</p>
          </CardContent>
        </Card>
      )}

      {!filtered && positions.map((pos) => {
        const isOpen = !!expanded[pos.id];
        const cands = candidatesMap[pos.id] ?? [];
        const isLoadingCands = loadingMap[pos.id];

        return (
          <motion.div key={pos.id} variants={item}>
            <Card className="glass-strong overflow-hidden">
              {/* Position header / toggle */}
              <button
                onClick={() => toggleExpand(pos.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{pos.title}</p>
                  <p className="text-xs text-muted-foreground">{pos.business_unit} · {pos.location}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${pos.status === "Active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-border/50 text-muted-foreground"}`}>
                    {pos.status === "Active" ? "Open" : "Closed"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{pos.candidates_count} candidate{pos.candidates_count !== 1 ? "s" : ""}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Candidates rows */}
              {isOpen && (
                <div className="border-t border-border/20">
                  {isLoadingCands ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : cands.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">No candidates yet for this position.</div>
                  ) : (
                    cands.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onViewCandidate?.(pos.id, c.id)}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.role}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs hidden sm:flex ${STAGE_COLORS[c.stage] || STAGE_COLORS["Sourced"]}`}>{c.stage}</Badge>
                        <Badge variant="outline" className={`text-xs ${VERDICT_COLORS[c.verdict] || VERDICT_COLORS["Pending"]}`}>{c.verdict}</Badge>
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono">R:{c.scores.resume.toFixed(1)}</span>
                            <span className="font-mono">P:{c.scores.psych.toFixed(1)}</span>
                          </div>
                          <div className="w-16 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${c.scores.composite >= 85 ? 'bg-emerald-400' : c.scores.composite >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(c.scores.composite, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${c.scores.composite >= 85 ? "text-emerald-400" : c.scores.composite >= 70 ? "text-yellow-400" : "text-red-400"}`}>{c.scores.composite}%</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
