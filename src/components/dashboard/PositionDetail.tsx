import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  UserPlus,
  Users,
  Target,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Clock,
  Star,
  FileText,
  Brain,
  Video,
  Package,
  Lock,
  FolderOpen,
  Settings,
  Edit3,
  Upload,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Activity,
  X,
  ListChecks,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MainLoader } from "@/components/ui/main-loader";
import { Textarea } from "@/components/ui/textarea";
import { ApiPosition, ApiPositionJD } from "@/types/api";
import { usePositions } from "@/hooks/usePositions";
import { enhanceJDWithAI, enhanceFullJDWithAI } from "@/lib/openrouter";
import { PsychometricsTab } from "@/components/dashboard/PsychometricsTab";
import { useToast } from "@/hooks/use-toast";
import { CandidatesTab } from "@/components/dashboard/CandidatesTab";
import { CandidateDetailView } from "@/components/dashboard/CandidateDetailView";
import { PsychometricScoringModal } from "@/components/dashboard/PsychometricScoringModal";
import { FitmentReportPanel } from "@/components/dashboard/FitmentReportPanel";
import { PositionL1QuestionsTab } from "@/components/dashboard/PositionL1QuestionsTab";
import { psychometricApi } from "@/lib/psychometricApi";
import type { PsychometricProfile, FitmentReport } from "@/types/psychometric";
import { JDComparisonSlider } from "@/components/ui/jd-comparison-slider";
import { computeJDDiff, type DiffSegment, type ItemDiff } from "@/lib/jd-diff-utils";

const TABS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "jd", label: "JD", icon: FileText },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "l1-questions", label: "Interview Questions", icon: ListChecks },
  { id: "psychometrics", label: "Psychometrics", icon: Brain },
  { id: "interviews", label: "Interviews", icon: Video },
  { id: "decision-pack", label: "Decision Pack", icon: Package },
  { id: "integrity", label: "Integrity", icon: Lock },
  { id: "evidence", label: "Evidence", icon: FolderOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

interface PositionDetailProps {
  positionId: string;
  onBack: () => void;
}

export function PositionDetail({ positionId, onBack }: PositionDetailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("t") || "overview";
  const viewingCandidateId = searchParams.get("c") || null;
  const viewingCandidateTab = searchParams.get("ct") || "resume";

  const setActiveTab = (tab: string) => setSearchParams(prev => { prev.set("t", tab); return prev; }, { replace: true });
  const setViewingCandidateId = (cid: string | null, cTab?: string) => setSearchParams(prev => { 
    if (cid) { prev.set("c", cid); if (cTab) prev.set("ct", cTab); else prev.delete("ct"); } 
    else { prev.delete("c"); prev.delete("ct"); } 
    return prev; 
  }, { replace: true });

  const { positions, saveJD, saveL1Questions, addCandidate, deleteCandidate, getCandidates, isLoading, setCandidatesCount } = usePositions();

  // EOS-IA Psychometric state
  const [psychProfile, setPsychProfile] = useState<PsychometricProfile | null>(null);
  const [psychProfileLoading, setPsychProfileLoading] = useState(false);
  const [scoringModal, setScoringModal] = useState<{ open: boolean; candidateId: string; candidateName: string } | null>(null);
  const [fitmentReports, setFitmentReports] = useState<Record<string, FitmentReport>>({});

  const position = useMemo(() => {
    return positions.find((p) => p.id === positionId) || null;
  }, [positionId, positions]);

  const handleJDSaved = useCallback(async (jd: ApiPositionJD, versionCounter: number) => {
    await saveJD(positionId, jd, versionCounter);
  }, [positionId, saveJD]);

  const loadPsychProfile = useCallback(async () => {
    setPsychProfileLoading(true);
    try {
      const p = await psychometricApi.getProfile(positionId);
      setPsychProfile(p);
    } catch { setPsychProfile(null); }
    finally { setPsychProfileLoading(false); }
  }, [positionId]);

  const handleGenerateProfile = useCallback(async () => {
    setPsychProfileLoading(true);
    try {
      const p = await psychometricApi.generateProfile(positionId);
      setPsychProfile(p);
    } catch (e) {
      toast({ title: "Profile generation failed", description: String(e), variant: "destructive" });
    } finally { setPsychProfileLoading(false); }
  }, [positionId]);

  const { toast } = useToast();
  // Auto-load saved psychometric profile when Psychometrics tab opens
  useEffect(() => {
    if (activeTab === "psychometrics" && !psychProfile && !psychProfileLoading) {
      loadPsychProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCandidatesLoaded = useCallback((count: number) => {
    setCandidatesCount(positionId, count);
  }, [positionId, setCandidatesCount]);

  const handleOpenScoring = useCallback((candidateId: string, candidateName: string) => {
    setScoringModal({ open: true, candidateId, candidateName });
  }, []);

  if (isLoading && !position) {
    return (
      <div className="py-20">
        <MainLoader text="Loading position..." />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Position not found.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Positions
        </Button>
      </div>
    );
  }

  if (viewingCandidateId) {
    return (
      <CandidateDetailView 
        candidateId={viewingCandidateId} 
        positionId={positionId} 
        initialTab={viewingCandidateTab}
        onBack={() => setViewingCandidateId(null)} 
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">{position.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono border-border/50">{position.req_id}</Badge>
              <span className="text-sm text-muted-foreground">{position.location}</span>
              <span className="text-sm text-muted-foreground">• {position.business_unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <Button variant="outline" size="sm" className="border-border/50">
            <Download className="h-4 w-4 mr-1" /> Board Pack
          </Button>
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setActiveTab("candidates")}>
            <UserPlus className="h-4 w-4 mr-1" /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto p-1.5 bg-muted/30 rounded-xl border border-border/40 scrollbar-hide w-full max-w-full lg:w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-background border border-border/60 shadow-sm text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground font-medium"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "candidates" && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/20 text-primary border-0">{position.candidates_count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab position={position} />}
      {activeTab === "jd" && <JDTab position={position} onJDSaved={handleJDSaved} />}
      {activeTab === "candidates" && (
        <CandidatesTab
          positionId={positionId}
          onAddCandidate={(data) => addCandidate(positionId, data)}
          positionTitle={position.title}
          onViewCandidate={(id) => setViewingCandidateId(id)}
          onDeleteCandidate={deleteCandidate}
          getCandidates={getCandidates}
          onCandidatesLoaded={handleCandidatesLoaded}
          onScorePsychometric={handleOpenScoring}
          onViewReport={(candidateId, candidateName) => {
            setViewingCandidateId(candidateId, "psychometric");
          }}
        />
      )}
      {activeTab === "l1-questions" && (
        <PositionL1QuestionsTab 
          position={position} 
          onSave={async (q) => { await saveL1Questions(position.id, q); }} 
        />
      )}
      {activeTab === "psychometrics" && (
        <PsychometricsTab
          position={position}
          fitmentReports={fitmentReports}
          onOpenScoring={handleOpenScoring}
          onViewReport={(candidateId, candidateName) => {
            setViewingCandidateId(candidateId, "psychometric");
          }}
        />
      )}
      {!["overview", "jd", "candidates", "l1-questions", "psychometrics"].includes(activeTab) && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted mb-4">
              {TABS.find((t) => t.id === activeTab)?.icon &&
                (() => { const Icon = TABS.find((t) => t.id === activeTab)!.icon; return <Icon className="h-7 w-7 text-muted-foreground" />; })()
              }
            </div>
            <p className="text-lg font-semibold text-foreground font-display capitalize">{activeTab.replace("-", " ")}</p>
            <p className="text-sm text-muted-foreground mt-1">This section is coming soon.</p>
          </CardContent>
        </Card>
      )}

      {/* EOS-IA Scoring Modal */}
      {scoringModal && (
        <PsychometricScoringModal
          open={scoringModal.open}
          onClose={() => setScoringModal(null)}
          candidateId={scoringModal.candidateId}
          candidateName={scoringModal.candidateName}
          positionId={positionId}
          onReportGenerated={(report) => {
            setFitmentReports(prev => ({ ...prev, [scoringModal.candidateId]: report }));
            setViewingCandidateId(scoringModal.candidateId, "psychometric");
          }}
        />
      )}
    </motion.div>
  );
}

function OverviewTab({ position }: { position: ApiPosition }) {
  const pipelineHealth = position.candidates_count === 0 ? "Empty" : position.candidates_count < 4 ? "Building" : "Active";
  const pipelineColor = pipelineHealth === "Empty" ? "text-muted-foreground" : pipelineHealth === "Building" ? "text-amber-400" : "text-emerald-400";
  const pipelineBg = pipelineHealth === "Empty" ? "bg-muted/10" : pipelineHealth === "Building" ? "bg-amber-500/10" : "bg-emerald-500/10";
  const pipelineBorder = pipelineHealth === "Empty" ? "border-border/20" : pipelineHealth === "Building" ? "border-amber-500/20" : "border-emerald-500/20";

  const stats = [
    { label: "Total Candidates", value: position.candidates_count, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Shortlisted", value: position.shortlisted_count, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", extra: position.candidates_count > 0 ? `${Math.round((position.shortlisted_count / position.candidates_count) * 100)}% of total` : undefined },
    { label: "Pipeline Health", value: pipelineHealth, icon: Activity, color: pipelineColor, bg: pipelineBg, border: pipelineBorder },
    { label: "Risk Indicators", value: position.risk_flag ? "Flagged" : "Clear", icon: AlertTriangle, color: position.risk_flag ? "text-red-400" : "text-emerald-400", bg: position.risk_flag ? "bg-red-500/10" : "bg-emerald-500/10", border: position.risk_flag ? "border-red-500/20" : "border-emerald-500/20" },
  ];

  const screenedPct = position.candidates_count > 0 ? Math.round((position.shortlisted_count / position.candidates_count) * 100) : 0;

  const funnel = [
    { stage: "Sourced", count: position.candidates_count, pct: 100, icon: Users, color: "text-blue-400", bg: "bg-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]" },
    { stage: "Screened / Shortlisted", count: position.shortlisted_count, pct: screenedPct, icon: Brain, color: "text-purple-400", bg: "bg-purple-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]" },
    { stage: "Interview Stage", count: 0, pct: 0, icon: Video, color: "text-pink-400", bg: "bg-pink-500", glow: "shadow-[0_0_15px_rgba(236,72,153,0.5)]" },
    { stage: "Offer Released", count: 0, pct: 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Premium Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="relative overflow-hidden group border-border/40 hover:border-border/80 transition-all duration-500 hover:shadow-[0_0_2rem_-0.5rem_rgba(255,255,255,0.05)] bg-background/40 backdrop-blur-xl h-full">
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 rounded-full translate-x-12 -translate-y-12 ${s.bg.replace('/10', '/100')}`} />
              <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${s.bg} ${s.border} border border-opacity-50`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  {s.extra && <Badge variant="outline" className="text-[10px] font-mono border-border/50 text-muted-foreground">{s.extra}</Badge>}
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-display text-foreground tracking-tight">{s.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Animated Pipeline Funnel */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border-border/40 bg-background/40 backdrop-blur-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full opacity-50 transition-opacity duration-700 pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Conversion Pipeline
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Real-time candidate progression funnel</p>
                </div>
                <Badge className={`cursor-default ${position.candidates_count > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50 text-muted-foreground border-border/30'}`}>
                  <Activity className="h-3 w-3 mr-1" /> {position.candidates_count > 0 ? 'Active' : 'Empty'}
                </Badge>
              </div>

              <div className="space-y-8">
                {funnel.map((f, i) => (
                  <div key={f.stage} className="relative group/bar cursor-default">
                    <div className="flex items-center mb-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background border border-border/50 shadow-sm group-hover/bar:scale-110 transition-transform duration-300`}>
                          <f.icon className={`h-4 w-4 ${f.color}`} />
                        </div>
                        <span className="text-sm font-semibold text-foreground tracking-wide">{f.stage}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-sm font-bold text-foreground font-display text-xl">{f.count}</span>
                        <span className="text-xs text-muted-foreground mb-1 font-mono">({f.pct}%)</span>
                      </div>
                    </div>
                    <div className="h-4 w-full rounded-full bg-muted/30 overflow-hidden relative border border-border/20 backdrop-blur-sm">
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${Math.max(f.pct, f.count > 0 ? 3 : 0)}%`, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.2 + (i * 0.15), ease: "easeOut" }}
                        className={`absolute top-0 left-0 h-full rounded-full ${f.bg} ${f.glow} relative overflow-hidden`}
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights Panel — Data-driven */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full border-border/40 bg-gradient-to-b from-primary/[0.02] to-transparent backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-display">EOS-IA Insights</h3>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>

              <div className="space-y-4">
                {/* Pipeline insight — real data */}
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-background/60 border border-border/50 transition-all cursor-default shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Activity className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Pipeline Status</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {position.candidates_count === 0
                          ? "No candidates sourced yet. Add candidates to start building your pipeline."
                          : position.shortlisted_count > 0
                            ? <>{position.shortlisted_count} out of {position.candidates_count} candidates have been <span className="text-emerald-400 font-medium">screened and shortlisted</span>.</>
                            : <>{position.candidates_count} candidate{position.candidates_count > 1 ? 's' : ''} sourced. <span className="text-amber-400 font-medium">Run screening</span> to advance the pipeline.</>
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Quality insight — real data */}
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-background/60 border border-border/50 transition-all cursor-default shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Target className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Quality Signals</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {position.shortlisted_count > 0
                          ? <>Screening rate is <span className="text-primary font-medium">{screenedPct}%</span>. {screenedPct >= 50 ? "Strong candidate pool quality." : "Consider refining sourcing criteria."}</>
                          : "Run psychometric evaluations on candidates to unlock quality insights."
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Risk insight — real data */}
                {position.risk_flag ? (
                  <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 transition-all cursor-default shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-500">Risk Detected</p>
                        <p className="text-xs text-red-500/80 mt-1.5 leading-relaxed">Flag: {position.risk_flag}. Review and take action to mitigate.</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 transition-all cursor-default shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-500">No Active Risks</p>
                        <p className="text-xs text-emerald-500/80 mt-1.5 leading-relaxed">All parameters are within acceptable range. No bottlenecks identified.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border/40">
                <Button variant="outline" className="w-full border-border/50 bg-background/50 backdrop-blur">
                  View Full Analytics <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Diff rendering helpers ───────────────────────────────────────────────── */

function DiffWordSegments({ segments, side }: { segments: DiffSegment[]; side: "before" | "after" }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "same") {
          return <span key={i}>{seg.text}</span>;
        }
        if (seg.type === "removed" && side === "before") {
          return (
            <span
              key={i}
              className="bg-red-500/20 text-red-400 dark:bg-red-500/15 dark:text-red-300 rounded px-0.5 line-through decoration-red-400/50"
            >
              {seg.text}
            </span>
          );
        }
        if (seg.type === "added" && side === "after") {
          return (
            <span
              key={i}
              className="bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 rounded px-0.5"
            >
              {seg.text}
            </span>
          );
        }
        // Hide removed words on after side and added words on before side
        return null;
      })}
    </>
  );
}

function DiffItemRenderer({ item, index, side, numbered }: { item: ItemDiff; index: number; side: "before" | "after"; numbered?: boolean }) {
  const bullet = numbered
    ? <span className="text-primary font-bold shrink-0">{index + 1}.</span>
    : <span className="text-primary mt-0.5 shrink-0">•</span>;

  if (item.status === "same") {
    return (
      <li className="text-xs text-muted-foreground flex items-start gap-1.5">
        {bullet} {item.text}
      </li>
    );
  }

  if (item.status === "removed" && side === "before") {
    return (
      <li className="text-xs flex items-start gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 bg-red-500/10 border border-red-500/20">
        {bullet}
        <span className="text-red-400 dark:text-red-300 line-through decoration-red-400/50">{item.text}</span>
      </li>
    );
  }

  if (item.status === "added" && side === "after") {
    return (
      <li className="text-xs flex items-start gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 bg-emerald-500/10 border border-emerald-500/20">
        {bullet}
        <span className="text-emerald-600 dark:text-emerald-300">{item.text}</span>
      </li>
    );
  }

  if (item.status === "modified" && item.wordDiff) {
    const bgClass = side === "before"
      ? "bg-amber-500/10 border border-amber-500/20"
      : "bg-emerald-500/10 border border-emerald-500/20";
    return (
      <li className={`text-xs flex items-start gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 ${bgClass}`}>
        {bullet}
        <span className="text-muted-foreground">
          <DiffWordSegments segments={item.wordDiff} side={side} />
        </span>
      </li>
    );
  }

  // Fallback
  return (
    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
      {bullet} {item.text}
    </li>
  );
}

/* ── JDContentCard — supports optional diff highlighting ─────────────────── */

interface JDContentCardProps {
  jd: ApiPositionJD;
  className?: string;
  /** Pass the other JD to enable diff highlighting */
  compareWith?: ApiPositionJD;
  /** Which side this card represents */
  side?: "before" | "after";
}

function JDContentCard({ jd, className = "", compareWith, side }: JDContentCardProps) {
  // Compute diff if comparison data is provided
  const diff = useMemo(() => {
    if (!compareWith || !side) return null;
    return computeJDDiff(
      side === "before" ? jd : compareWith,
      side === "before" ? compareWith : jd,
      side
    );
  }, [jd, compareWith, side]);

  return (
    <div className={`space-y-4 p-5 bg-background min-h-full ${className}`}>
      {/* Role Purpose */}
      <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">Role Purpose</h4>
        </div>
        {diff && diff.purposeChanged && side ? (
          <p className="text-xs leading-relaxed whitespace-pre-wrap">
            <DiffWordSegments segments={diff.purposeDiff} side={side} />
          </p>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{jd.purpose}</p>
        )}
      </div>

      {/* Education */}
      <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">Education</h4>
        </div>
        <ul className="space-y-1">
          {diff && side ? (
            diff.education.map((item, i) => (
              <DiffItemRenderer key={i} item={item} index={i} side={side} />
            ))
          ) : (
            jd.education.map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">•</span> {e}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Experience */}
      <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">Experience</h4>
        </div>
        <ul className="space-y-1">
          {diff && side ? (
            diff.experience.map((item, i) => (
              <DiffItemRenderer key={i} item={item} index={i} side={side} />
            ))
          ) : (
            jd.experience.map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">•</span> {e}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Responsibilities */}
      <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-3.5 w-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">Responsibilities</h4>
        </div>
        <ul className="space-y-1">
          {diff && side ? (
            diff.responsibilities.map((item, i) => (
              <DiffItemRenderer key={i} item={item} index={i} side={side} numbered />
            ))
          ) : (
            jd.responsibilities.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span> {r}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Skills */}
      <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-3.5 w-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">Skills</h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {diff && side ? (
            diff.skills.map((s) => {
              if (s.status === "removed") {
                return (
                  <span key={s.text} className="text-[10px] bg-red-500/15 text-red-400 dark:text-red-300 border border-red-500/25 rounded-md px-2 py-0.5 line-through">
                    {s.text}
                  </span>
                );
              }
              if (s.status === "added") {
                return (
                  <span key={s.text} className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 rounded-md px-2 py-0.5">
                    {s.text}
                  </span>
                );
              }
              return (
                <span key={s.text} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-0.5">{s.text}</span>
              );
            })
          ) : (
            jd.skills.map((s) => (
              <span key={s} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-0.5">{s}</span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function JDTab({ position, onJDSaved }: { position: ApiPosition; onJDSaved: (jd: ApiPositionJD, versionCounter: number) => void }) {
  const { toast } = useToast();
  const [jdView, setJdView] = useState<"choice" | "paste" | "enhance_full" | "view" | "compare">("view");
  const [jdText, setJdText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Version to use as the BASE for enhancement (dropdown selection)
  const [enhanceBaseVersionId, setEnhanceBaseVersionId] = useState<number | null>(null);
  
  // Comparison state: before JD and after JD for the slider
  const [compareBeforeJD, setCompareBeforeJD] = useState<ApiPositionJD | null>(null);
  const [compareAfterJD, setCompareAfterJD] = useState<ApiPositionJD | null>(null);
  
  // Track selected version separately from the "latest"
  const defaultVersion = position.jd_versions && position.jd_versions.length > 0
    ? position.jd_versions[position.jd_versions.length - 1].version
    : 1;
  const [selectedVersionId, setSelectedVersionId] = useState<number>(defaultVersion);

  const displayJD = useMemo(() => {
    if (!position.jd) return null;
    if (position.jd_versions && position.jd_versions.length > 0) {
      const ver = position.jd_versions.find(v => v.version === selectedVersionId);
      if (ver) return ver.jd;
    }
    return position.jd;
  }, [position, selectedVersionId]);

  // Get the JD for the selected enhance base version
  const enhanceBaseJD = useMemo(() => {
    if (enhanceBaseVersionId === null) return displayJD;
    if (position.jd_versions && position.jd_versions.length > 0) {
      const ver = position.jd_versions.find(v => v.version === enhanceBaseVersionId);
      if (ver) return ver.jd;
    }
    return position.jd;
  }, [enhanceBaseVersionId, position, displayJD]);

  const handleSaveJD = async () => {
    if (!jdText.trim()) return;
    setIsEnhancing(true);
    try {
      // Pass the selected base version JD as context
      const baseJD = enhanceBaseJD || displayJD || undefined;
      const enhancedJD = await enhanceJDWithAI(jdText, baseJD);
      
      // Store before and after for comparison
      if (baseJD) {
        setCompareBeforeJD(baseJD);
        setCompareAfterJD(enhancedJD);
        setJdView("compare");
      } else {
        // No existing JD → save directly
        const nextVersion = (position.jd_versions?.length ?? 0) + 1;
        onJDSaved(enhancedJD, nextVersion);
        setSelectedVersionId(nextVersion);
        setJdView("view");
        toast({
          title: "JD Enhanced successfully",
          description: `Version ${nextVersion} saved.`,
        });
      }
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "Failed to enhance JD",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptComparison = () => {
    if (!compareAfterJD) return;
    const nextVersion = (position.jd_versions?.length ?? 0) + 1;
    onJDSaved(compareAfterJD, nextVersion);
    setSelectedVersionId(nextVersion);
    setCompareBeforeJD(null);
    setCompareAfterJD(null);
    setJdText("");
    setJdView("view");
    toast({
      title: "JD Enhanced successfully",
      description: `Version ${nextVersion} saved.`,
    });
  };

  const handleDiscardComparison = () => {
    setCompareBeforeJD(null);
    setCompareAfterJD(null);
    setJdView("paste");
  };

  const handleEnhanceFullJD = async () => {
    if (!jdText.trim()) return;
    setIsEnhancing(true);
    try {
      const enhancedJD = await enhanceFullJDWithAI(jdText);
      const nextVersion = (position.jd_versions?.length ?? 0) + 1;
      onJDSaved(enhancedJD, nextVersion);
      setSelectedVersionId(nextVersion);
      setJdView("view");
      toast({
        title: "JD Completely Enhanced",
        description: `Your pasted JD has been transformed into Version ${nextVersion}.`,
      });
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "Failed to enhance JD",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileUploadHeader = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === "string" && content.trim()) {
        setIsEnhancing(true);
        try {
          const enhancedJD = await enhanceFullJDWithAI(content);
          const nextVersion = (position.jd_versions?.length ?? 0) + 1;
          onJDSaved(enhancedJD, nextVersion);
          setSelectedVersionId(nextVersion);
          setJdView("view");
          toast({
            title: "File Analyzed & JD Created",
            description: `Your uploaded file has been transformed into Version ${nextVersion}.`,
          });
        } catch (error) {
          toast({
            title: "Upload Analysis failed",
            description: error instanceof Error ? error.message : "Failed to analyze loaded JD",
            variant: "destructive"
          });
        } finally {
          setIsEnhancing(false);
          e.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("jd-export-container");
    if (!element) return;
    
    try {
      // @ts-ignore - dynamic import without types
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     `${position.title.replace(/ /g, '_')}_JD_v${selectedVersionId}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
      toast({
        title: "PDF Exported",
        description: "Your Job Description has been downloaded successfully.",
      });
    } catch (e) {
      console.error(e);
      toast({ 
        title: 'Export failed', 
        description: 'An error occurred while building the PDF.',
        variant: 'destructive' 
      });
    }
  };

  // No JD — show choice or paste view
  if (!displayJD || jdView !== "view") {

    // ── COMPARISON VIEW ─────────────────────────────────────────────────────
    if (jdView === "compare" && compareBeforeJD && compareAfterJD) {
      return (
        <div className="space-y-4">
          <Card className="glass-strong">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground font-display">Review Changes</h3>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 ml-1">Before / After</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Drag the slider to compare the original vs enhanced JD</p>
              </div>

              <JDComparisonSlider
                beforeLabel={`v${enhanceBaseVersionId ?? selectedVersionId} · Original`}
                afterLabel="New · Enhanced"
                beforeContent={<JDContentCard jd={compareBeforeJD} compareWith={compareAfterJD} side="before" />}
                afterContent={<JDContentCard jd={compareAfterJD} compareWith={compareBeforeJD} side="after" />}
              />

              <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border/30">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDiscardComparison} 
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptComparison}
                  className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 min-w-[160px]"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Accept & Save as v{(position.jd_versions?.length ?? 0) + 1}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // ── PASTE / ENHANCE EXISTING JD VIEW ─────────────────────────────────────
    if (jdView === "paste") {
      const hasVersions = position.jd_versions && position.jd_versions.length > 0;

      return (
        <Card className="glass-strong">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-display">{displayJD ? "Enhance Existing JD" : "Paste & Enhance Job Description"}</h3>
            </div>

            {/* VERSION SELECTOR — only when modifying an existing JD */}
            {displayJD && hasVersions && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Base Version:</label>
                <select
                  value={enhanceBaseVersionId ?? selectedVersionId}
                  onChange={(e) => setEnhanceBaseVersionId(Number(e.target.value))}
                  className="flex-1 max-w-[240px] text-sm bg-background/70 border border-border/50 rounded-lg px-3 py-1.5 text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                  disabled={isEnhancing}
                >
                  {position.jd_versions!.map((v) => (
                    <option key={v.version} value={v.version}>
                      Version {v.version} — {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground/70">
                  Select which version the AI should modify
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {displayJD 
                ? "Provide specific instructions to modify the selected version. Example: 'Change the experience level to fresher (0-1 years) and add Python to the skills.' The AI will keep the rest of your beautiful JD intact." 
                : "Paste your raw constraints, notes, or poorly formatted job description here. Our AI will automatically structure and enhance it into a professional format."}
            </p>
            <Textarea
              placeholder={displayJD ? "E.g., Make the experience section require 0-1 years of experience..." : "E.g., We need a senior dev with 5 years react and typescript..."}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-[250px] bg-background/50 border-border/50 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground resize-none"
              disabled={isEnhancing}
            />
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => { setJdView(position.jd ? "view" : "choice"); setEnhanceBaseVersionId(null); }} disabled={isEnhancing}>Back</Button>
              <Button
                onClick={handleSaveJD}
                disabled={!jdText.trim() || isEnhancing}
                className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 min-w-[140px]"
              >
                {isEnhancing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enhancing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generate & Compare
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (jdView === "enhance_full") {
      return (
        <Card className="glass-strong">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-display">Paste Existing Job Description</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your entire existing Job Description here. Our AI will analyze it, fix grammar, expand on short bullet points, and restructure it into our elite FAANG format.
            </p>
            <Textarea
              placeholder="Paste your existing full Job Description text here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-[250px] bg-background/50 border-border/50 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground resize-none"
              disabled={isEnhancing}
            />
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setJdView(position.jd ? "view" : "choice")} disabled={isEnhancing}>Back</Button>
              <Button
                onClick={handleEnhanceFullJD}
                disabled={!jdText.trim() || isEnhancing}
                className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 min-w-[140px]"
              >
                {isEnhancing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enhancing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Transform & Save
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Choice view
    return (
      <Card className="glass-strong">
        <CardContent className="p-12">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground font-display">No Job Description Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Choose how you'd like to add one.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => setJdView("paste")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group relative overflow-hidden"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary group-hover:glow-sm transition-all z-10">
                <Edit3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="text-center z-10">
                <p className="font-semibold text-foreground text-sm flex items-center justify-center gap-1">Paste <Sparkles className="h-3 w-3 text-primary" /></p>
                <p className="text-xs text-muted-foreground mt-1">AI will enhance formatting</p>
              </div>
            </button>
            <button
              onClick={() => {
                setJdText("");
                setJdView("enhance_full");
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted group-hover:bg-muted/80 transition-all">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm flex items-center justify-center gap-1">Enhance Existing JD <Sparkles className="h-3 w-3 text-primary" /></p>
                <p className="text-xs text-muted-foreground mt-1">Paste a full JD to convert</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // JD exists — render it
  const jd = displayJD;
  if (!jd) return null; // Should not happen

  return (
    <div className="space-y-6">
      {/* Version Header Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Version History:</span>
          <div className="flex gap-2">
            {(position.jd_versions && position.jd_versions.length > 0 ? position.jd_versions : [{version: 1}]).map((v: any) => (
              <Badge 
                key={v.version}
                variant={selectedVersionId === v.version ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${selectedVersionId === v.version ? "gradient-primary border-transparent" : "hover:border-primary/50"}`}
                onClick={() => setSelectedVersionId(v.version)}
              >
                v{v.version}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* File Upload Hidden Input & Label Button */}
          <label className={`flex items-center gap-2 h-9 px-3 text-sm font-medium transition-colors border border-border/50 rounded-md cursor-pointer ${isEnhancing ? 'opacity-50 pointer-events-none' : 'hover:bg-muted'}`}>
            <Upload className="h-4 w-4" />
            {isEnhancing ? "Analyzing..." : "Upload JD"}
            <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUploadHeader} disabled={isEnhancing} />
          </label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={isEnhancing}
            className="border-border/50 hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isEnhancing}
            className="border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => {
              setJdText("");
              setJdView("paste"); // Clear text to let them paste fresh criteria for new version
            }}
          >
            {isEnhancing ? (
              <div className="h-4 w-4 mr-2 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Enhance / Modify
          </Button>
        </div>
      </div>
      
      <div id="jd-export-container" className="space-y-6">
        {/* Role Purpose */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground font-display">Role Purpose</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{jd.purpose}</p>
        </CardContent>
      </Card>

      {/* Education & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-display">Education</h3>
            </div>
            <ul className="space-y-2">
              {jd.education.map((e, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1.5 shrink-0">•</span> {e}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-display">Experience</h3>
            </div>
            <ul className="space-y-2">
              {jd.experience.map((e, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1.5 shrink-0">•</span> {e}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Responsibilities */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground font-display">Key Responsibilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jd.responsibilities.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                <span className="text-primary font-bold text-sm shrink-0">{i + 1}.</span>
                <p className="text-sm text-muted-foreground">{r}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground font-display">Good-to-Have Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {jd.skills.map((s) => (
              <Badge key={s} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
