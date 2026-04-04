import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Brain,
  Target,
  Users,
  Clock,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  MessageSquare,
  Shield,
  Lightbulb,
  Award,
  BarChart3,
  Sparkles,
  FileText,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  interviewIntelligenceApi,
  type InterviewAnalysisListItem,
  type InterviewAnalysisFull,
} from "@/lib/interviewIntelligenceApi";

interface Props {
  positionId: string;
  positionTitle: string;
}

type ReportTab = "interviewer" | "candidate" | "quality";

export function InterviewIntelligenceTab({ positionId, positionTitle }: Props) {
  const [analyses, setAnalyses] = useState<InterviewAnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InterviewAnalysisFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportTab, setReportTab] = useState<ReportTab>("interviewer");

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await interviewIntelligenceApi.listForPosition(positionId);
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to load analyses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [positionId]);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await interviewIntelligenceApi.getAnalysis(id);
      setDetail(data);
    } catch (err) {
      console.error("Failed to load analysis:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Auto-poll when analysis is processing ───────────────────────────
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (detail?.status === "processing" && selectedId) {
      pollRef.current = window.setInterval(async () => {
        try {
          const updated = await interviewIntelligenceApi.getAnalysis(selectedId);
          setDetail(updated);
          if (updated.status !== "processing" && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            // Also refresh the list
            fetchAnalyses();
          }
        } catch { /* ignore polling errors */ }
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [detail?.status, selectedId, fetchAnalyses]);

  const verdictColor = (v?: string | null) => {
    if (!v) return "text-muted-foreground";
    const up = v.toUpperCase();
    if (up === "STRONG HIRE") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (up === "HIRE") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (up === "HOLD") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const scoreColor = (s?: number | null) => {
    if (!s) return "text-muted-foreground";
    if (s >= 80) return "text-emerald-400";
    if (s >= 65) return "text-blue-400";
    if (s >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  // ── Detail View ────────────────────────────────────────────────────
  if (selectedId && detail) {
    const ir = detail.interviewer_report || {};
    const cr = detail.candidate_report || {};
    const iq = detail.interviewer_quality || {};

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => { setSelectedId(null); setDetail(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to analyses
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground font-display">{detail.candidate_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {detail.position_title} · {Math.round(detail.duration_seconds / 60)} min · {detail.created_at?.slice(0, 10)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold font-display ${scoreColor(detail.overall_score)}`}>
              {detail.overall_score ?? "—"}
            </div>
            {detail.verdict && (
              <Badge variant="outline" className={`text-xs font-semibold ${verdictColor(detail.verdict)}`}>
                {detail.verdict}
              </Badge>
            )}
          </div>
        </div>

        {/* Report Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/40">
          {([
            { id: "interviewer" as ReportTab, label: "Recruiter Report", icon: Target },
            { id: "candidate" as ReportTab, label: "Candidate Feedback", icon: Users },
            { id: "quality" as ReportTab, label: "Interview Quality", icon: Award },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setReportTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                reportTab === t.id
                  ? "bg-background border border-border/60 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <AnimatePresence mode="wait">
          {detail.status === "processing" ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">AI Analysis in Progress...</p>
                <p className="text-sm text-muted-foreground mt-2">This usually takes 30-60 seconds. Refresh to check.</p>
                <Button variant="outline" onClick={() => openDetail(selectedId)} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </CardContent>
            </Card>
          ) : detail.status === "failed" ? (
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-12 text-center">
                <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">Analysis Failed</p>
                <p className="text-sm text-red-400/80 mt-2">{detail.error || "Unknown error"}</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div key={reportTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {reportTab === "interviewer" && <InterviewerReportView report={ir} />}
              {reportTab === "candidate" && <CandidateReportView report={cr} />}
              {reportTab === "quality" && <QualityReportView report={iq} />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Interview Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI-powered analysis of conducted interviews</p>
        </div>
        <Button variant="outline" onClick={fetchAnalyses} disabled={isLoading} className="border-border/40">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </motion.div>

      {isLoading ? (
        <Card className="glass-card p-12">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading analyses...</span>
          </div>
        </Card>
      ) : analyses.length === 0 ? (
        <motion.div variants={item}>
          <Card className="glass-card border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground font-display">No Interview Analyses Yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Schedule and conduct interviews with candidates. When the interview ends in the HireHand Interview Room,
                the AI will automatically analyze the transcript and generate comprehensive reports.
              </p>
              <div className="mt-6 flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-muted/30">1. Schedule</span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 rounded bg-muted/30">2. Interview</span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">3. AI Report</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <motion.div key={a.id} variants={item}>
              <Card
                onClick={() => openDetail(a.id)}
                className="glass-card cursor-pointer group hover:border-primary/30 transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                    a.status === "completed" ? "bg-primary/10 border-primary/20" :
                    a.status === "processing" ? "bg-amber-500/10 border-amber-500/20" :
                    "bg-red-500/10 border-red-500/20"
                  }`}>
                    {a.status === "processing" ? (
                      <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                    ) : a.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-red-400" />
                    ) : (
                      <Brain className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">{a.candidate_name}</p>
                      {a.verdict && (
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${verdictColor(a.verdict)}`}>
                          {a.verdict}
                        </Badge>
                      )}
                      {a.status === "processing" && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">
                          Processing...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {Math.round(a.duration_seconds / 60)} min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.created_at?.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  {a.overall_score != null && (
                    <div className={`text-2xl font-bold font-display ${scoreColor(a.overall_score)}`}>
                      {a.overall_score}
                    </div>
                  )}

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS: Report Views
// ══════════════════════════════════════════════════════════════════════

function InterviewerReportView({ report }: { report: any }) {
  if (!report || Object.keys(report).length === 0) {
    return <Card className="glass-card p-8 text-center text-muted-foreground">No interviewer report available.</Card>;
  }

  const cs = report.competency_summary || {};

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="glass-card overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Executive Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Competency Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Technical", value: cs.technical_avg, icon: BarChart3, color: "text-blue-400" },
          { label: "Behavioral", value: cs.behavioral_avg, icon: Users, color: "text-purple-400" },
          { label: "Communication", value: cs.communication_avg, icon: MessageSquare, color: "text-emerald-400" },
          { label: "Overall", value: cs.overall_avg, icon: Star, color: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold font-display text-foreground">{s.value ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strengths */}
      {report.key_strengths?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Key Strengths
            </h3>
            <div className="space-y-3">
              {report.key_strengths.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-sm font-medium text-foreground">{s.strength}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.evidence}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concerns */}
      {report.key_concerns?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Key Concerns
            </h3>
            <div className="space-y-3">
              {report.key_concerns.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{c.concern}</p>
                    <Badge variant="outline" className={`text-[10px] ${c.severity === "HIGH" ? "text-red-400 border-red-500/20" : c.severity === "MEDIUM" ? "text-amber-400 border-amber-500/20" : "text-muted-foreground"}`}>
                      {c.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.evidence}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Verdict Rationale
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.verdict_rationale}</p>
          {report.culture_fit_assessment && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/30">
              <span className="font-medium text-foreground">Culture Fit:</span> {report.culture_fit_assessment}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CandidateReportView({ report }: { report: any }) {
  if (!report || Object.keys(report).length === 0) {
    return <Card className="glass-card p-8 text-center text-muted-foreground">No candidate report available.</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Overall */}
      <Card className="glass-card overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-500/50 to-transparent" />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" /> Performance Overview
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{report.performance_score ?? "—"}</span>
              {report.grade && <Badge variant="outline" className="text-xs border-primary/30 text-primary">{report.grade}</Badge>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.overall_performance}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      {report.strengths?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" /> Strengths
            </h3>
            <div className="space-y-3">
              {report.strengths.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-sm font-medium text-foreground">{s.area}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements */}
      {report.improvements?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Areas for Growth
            </h3>
            <div className="space-y-3">
              {report.improvements.map((imp: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{imp.area}</p>
                    <Badge variant="outline" className={`text-[10px] ${imp.priority === "HIGH" ? "text-red-400 border-red-500/20" : "text-muted-foreground"}`}>
                      {imp.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{imp.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Roles */}
      {report.alternative_roles?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" /> Alternative Role Suggestions
            </h3>
            <div className="space-y-3">
              {report.alternative_roles.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm font-medium text-foreground">{r.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Tips */}
      {report.interview_tips?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" /> Personalized Interview Tips
            </h3>
            <ul className="space-y-2">
              {report.interview_tips.map((tip: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QualityReportView({ report }: { report: any }) {
  if (!report || Object.keys(report).length === 0) {
    return <Card className="glass-card p-8 text-center text-muted-foreground">No quality report available.</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Question Quality", value: report.question_quality_score, icon: FileText, color: "text-blue-400" },
          { label: "Coverage", value: report.competency_coverage_percent ? `${report.competency_coverage_percent}%` : "—", icon: Target, color: "text-emerald-400" },
          { label: "Interviewer Rating", value: report.interviewer_rating, icon: Award, color: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold font-display text-foreground">{s.value ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Interviewer Feedback
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.interviewer_feedback}</p>
        </CardContent>
      </Card>

      {/* Best Question & Missed Opportunity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {report.best_question_asked && (
          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Best Question Asked
              </h3>
              <p className="text-sm text-muted-foreground">{report.best_question_asked}</p>
            </CardContent>
          </Card>
        )}
        {report.missed_opportunity && (
          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Missed Opportunity
              </h3>
              <p className="text-sm text-muted-foreground">{report.missed_opportunity}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coverage Gaps */}
      {report.coverage_gaps?.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" /> Coverage Gaps
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.coverage_gaps.map((g: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs border-red-500/20 text-red-400 bg-red-500/5">{g}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bias */}
      {report.bias_indicators?.length > 0 && (
        <Card className="glass-card border-amber-500/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" /> Bias Indicators
            </h3>
            <ul className="space-y-2">
              {report.bias_indicators.map((b: string, i: number) => (
                <li key={i} className="text-sm text-amber-400/80 flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-1 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
