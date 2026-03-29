/**
 * FitmentReportPanel — Renders the 4-part EOS-IA Psychometric Fitment Report
 * Used inside CandidatesTab or Candidate detail view.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  AlertCircle, Loader2, RefreshCw, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { psychometricApi } from '@/lib/psychometricApi';
import type { FitmentReport } from '@/types/psychometric';

interface Props {
  candidateId: string;
  candidateName: string;
  positionId: string;
  initialReport?: FitmentReport | null;
  onOpenScoring: () => void;
}

const RISK_CONFIG: Record<string, { icon: any, color: string, badgeBg: string }> = {
  "LOW": { icon: CheckCircle2, color: "text-emerald-500 border-emerald-500/40", badgeBg: "bg-emerald-500/15" },
  "MEDIUM": { icon: AlertTriangle, color: "text-yellow-500 border-yellow-500/40", badgeBg: "bg-yellow-500/15" },
  "HIGH": { icon: XCircle, color: "text-red-500 border-red-500/40", badgeBg: "bg-red-500/15" },
};

const VERDICT_CONFIG = {
  'GO': { 
    icon: CheckCircle2, 
    color: 'text-emerald-500 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5', 
    glow: "shadow-[0_0_40px_-5px_rgba(16,185,129,0.25)]",
    ring: "ring-1 ring-emerald-500/30" 
  },
  'CONDITIONAL GO': { 
    icon: AlertTriangle, 
    color: 'text-yellow-500 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5', 
    glow: "shadow-[0_0_40px_-5px_rgba(234,179,8,0.25)]",
    ring: "ring-1 ring-yellow-500/30"
  },
  'NO-GO': { 
    icon: XCircle, 
    color: 'text-red-500 border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5', 
    glow: "shadow-[0_0_40px_-5px_rgba(239,68,68,0.25)]",
    ring: "ring-1 ring-red-500/30" 
  }
};

const CLUSTER_COLOR: Record<string, string> = {
  positive: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  neutral: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  negative: "text-rose-400 border-rose-500/40 bg-rose-500/10",
};

function scoreBarColor(score: number) {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function FitmentReportPanel({
  candidateId, candidateName, positionId, initialReport, onOpenScoring,
}: Props) {
  const [report, setReport] = useState<FitmentReport | null>(initialReport ?? null);
  const [loading, setLoading] = useState(!initialReport);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  // Sync when a freshly-generated report is passed down from the parent
  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      setLoading(false);
    }
  }, [initialReport]);

  // Load from backend when candidate changes and no report passed
  useEffect(() => {
    if (!initialReport) tryLoadReport();
  }, [candidateId]);

  const tryLoadReport = async () => {
    setLoading(true);
    try {
      const r = await psychometricApi.getReport(candidateId);
      setReport(r);
    } catch (e: any) {
      console.error("Failed to load fitment report:", e);
      setErrorStr(e.message || String(e));
    }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground bg-card/20 border border-border/10 rounded-3xl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-sm font-medium tracking-wide">Syncing telemetry & calibrating report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <CardContent className="p-16 text-center relative z-10 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 mb-6">
            <Brain className="h-10 w-10 text-primary-foreground" />
          </div>
          <p className="text-2xl font-black text-foreground font-display tracking-tight">No AI Fitment Report</p>
          <p className="text-[15px] font-medium text-muted-foreground mt-2 mb-8 max-w-sm">
            Generate the EOS-IA Intelligence Report to unlock deep psychological traits and fitment metrics.
          </p>
          {errorStr && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold p-4 rounded-xl mb-6 max-w-sm w-full shadow-sm text-left">
              ⚠ API Error: {errorStr}
            </div>
          )}
          <Button onClick={onOpenScoring} className="h-12 px-8 bg-foreground hover:bg-foreground/90 text-background font-bold tracking-wide rounded-2xl shadow-xl shadow-foreground/10 hover:-translate-y-0.5 transition-all">
            <Sparkles className="h-5 w-5 mr-3" /> Score & Generate Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  const riskCfg = RISK_CONFIG[report.risk.level] ?? RISK_CONFIG.MEDIUM;
  const verdictCfg = VERDICT_CONFIG[report.verdict.decision as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG['CONDITIONAL GO'];
  const VerdictIcon = verdictCfg.icon;
  const clusterColor = CLUSTER_COLOR[report.pattern_cluster.sentiment] ?? CLUSTER_COLOR.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-display">EOS-IA Fitment Report</h3>
          <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
            {report.generated_at?.slice(0, 10)}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenScoring} className="text-xs text-muted-foreground gap-1">
          <RefreshCw className="h-3 w-3" /> Re-score
        </Button>
      </div>

      {/* ── Part 4: Verdict (prominent) ─────────────────────────────────── */}
      <div className={`relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8 rounded-3xl border backdrop-blur-xl ${verdictCfg.color} ${verdictCfg.glow} ${verdictCfg.ring}`}>
        {/* Glow orb behind icon */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-current opacity-10 rounded-full blur-3xl" />
        
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-current bg-background/50 shadow-inner">
          <VerdictIcon className="h-10 w-10" />
        </div>
        <div className="relative flex-1 min-w-0 z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 mb-2">
            <h2 className="text-3xl font-black font-display tracking-tight uppercase drop-shadow-sm">{report.verdict.decision}</h2>
            <div className="px-3 py-1 rounded-lg bg-background/50 border border-current/20 w-fit">
              <span className="text-xl font-bold font-mono tracking-tight">{report.composite_psych_score}% Match</span>
            </div>
          </div>
          <p className="text-[15px] opacity-90 leading-relaxed max-w-3xl font-medium">{report.verdict.rationale}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Part 1: Trait Scoring Matrix ─────────────────────────────── */}
        <Card className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50" />
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground font-display">Trait Scoring Matrix</h4>
                <p className="text-xs text-muted-foreground mt-0.5">AI-calibrated behavioral analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              {report.trait_matrix.map(t => (
                <div key={t.trait} className="group p-4 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-primary/20 transition-all duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-foreground/90 font-display group-hover:text-primary transition-colors">{t.trait}</span>
                    <span className={`text-sm font-black tracking-tight shrink-0 px-2 py-0.5 rounded-md bg-background border ${
                      t.score >= 8 ? 'text-emerald-500 border-emerald-500/20' : t.score >= 6 ? 'text-yellow-500 border-yellow-500/20' : 'text-red-500 border-red-500/20'
                    }`}>{t.score}/10</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-background border border-border/50 overflow-hidden shadow-inner mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.score / 10) * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${scoreBarColor(t.score)} shadow-sm relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                    </motion.div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">{t.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* ── Part 2: Pattern Cluster ─────────────────────────────────── */}
          <Card className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </div>
                <h4 className="text-lg font-bold text-foreground font-display">Pattern Cluster</h4>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black mb-4 ${clusterColor} ring-1 ring-inset ring-current/10 shadow-sm`}>
                {report.pattern_cluster.name}
              </div>
              <p className="text-[14px] text-muted-foreground leading-relaxed font-medium">{report.pattern_cluster.description}</p>
            </CardContent>
          </Card>

          {/* ── Part 3: Psychometric Risk ───────────────────────────────── */}
          <Card className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-colors ${riskCfg.color.split(' ')[0].replace('text-', 'bg-')}`} />
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${riskCfg.badgeBg}`}>
                  <riskCfg.icon className={`h-5 w-5 ${riskCfg.color.split(' ')[0]}`} />
                </div>
                <h4 className="text-lg font-bold text-foreground font-display">Psychometric Risk</h4>
                <Badge variant="outline" className={`ml-auto text-xs px-3 py-1 font-bold tracking-wider rounded-lg border-2 ${riskCfg.color}`}>
                  {report.risk.level}
                </Badge>
              </div>
              <p className="text-[15px] font-bold text-foreground mb-2 leading-snug">{report.risk.statement}</p>
              <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">{report.risk.role_specific_risk}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coaching Note */}
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-sm overflow-hidden">
        <div className="absolute left-0 top-0 w-1.5 h-full gradient-primary" />
        <div className="flex items-start gap-4">
          <div className="p-2 bg-background rounded-full shadow-sm shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary mb-1 uppercase tracking-wider font-display">Strategic Coaching Note</p>
            <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">{report.verdict.coaching_note}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
