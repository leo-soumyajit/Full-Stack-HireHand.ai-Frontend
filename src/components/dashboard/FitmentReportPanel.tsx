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

const RISK_CONFIG = {
  LOW: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2, label: 'Low Risk' },
  MEDIUM: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: AlertCircle, label: 'Medium Risk' },
  HIGH: { color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: AlertTriangle, label: 'High Risk' },
};

const VERDICT_CONFIG = {
  'GO': { color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', icon: CheckCircle2, glow: 'shadow-emerald-500/20' },
  'CONDITIONAL GO': { color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10', icon: AlertCircle, glow: 'shadow-yellow-500/20' },
  'NO-GO': { color: 'text-red-400 border-red-500/40 bg-red-500/10', icon: XCircle, glow: 'shadow-red-500/20' },
};

const CLUSTER_COLOR = {
  positive: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  neutral: 'border-primary/30 bg-primary/5 text-primary',
  negative: 'border-red-500/30 bg-red-500/5 text-red-400',
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
    } catch { /* no report yet */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-10 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl gradient-primary mb-4">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground font-display">No Fitment Report Yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Score this candidate's psychometric traits and generate the EOS-IA intelligence report.
          </p>
          <Button onClick={onOpenScoring} className="gradient-primary text-primary-foreground font-semibold rounded-xl">
            <Sparkles className="h-4 w-4 mr-2" /> Score & Generate Report
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
      <div className={`flex items-center gap-4 p-5 rounded-2xl border shadow-lg ${verdictCfg.color} ${verdictCfg.glow}`}>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-current">
          <VerdictIcon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xl font-black font-display tracking-wide">{report.verdict.decision}</p>
            <span className="text-2xl font-black font-mono">{report.composite_psych_score}%</span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">{report.verdict.rationale}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Part 1: Trait Scoring Matrix ─────────────────────────────── */}
        <Card className="glass-strong">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground font-display">Trait Scoring Matrix</h4>
            </div>
            <div className="space-y-3">
              {report.trait_matrix.map(t => (
                <div key={t.trait}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground truncate pr-2">{t.trait}</span>
                    <span className={`text-xs font-bold shrink-0 ${
                      t.score >= 8 ? 'text-emerald-400' : t.score >= 6 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{t.score}/10</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.score / 10) * 100}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className={`h-full rounded-full ${scoreBarColor(t.score)}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* ── Part 2: Pattern Cluster ─────────────────────────────────── */}
          <Card className="glass-strong">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground font-display">Pattern Cluster</h4>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold mb-2 ${clusterColor}`}>
                {report.pattern_cluster.name}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{report.pattern_cluster.description}</p>
            </CardContent>
          </Card>

          {/* ── Part 3: Psychometric Risk ───────────────────────────────── */}
          <Card className="glass-strong">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <riskCfg.icon className={`h-4 w-4 ${riskCfg.color.split(' ')[0]}`} />
                <h4 className="text-sm font-semibold text-foreground font-display">Psychometric Risk</h4>
                <Badge variant="outline" className={`ml-auto text-xs px-2 ${riskCfg.color}`}>
                  {report.risk.level}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{report.risk.statement}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{report.risk.role_specific_risk}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coaching Note */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
        <p className="text-xs font-medium text-muted-foreground mb-1">📌 Coaching Note</p>
        <p className="text-sm text-foreground leading-relaxed">{report.verdict.coaching_note}</p>
      </div>
    </motion.div>
  );
}
