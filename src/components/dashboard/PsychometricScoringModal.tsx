/**
 * PsychometricScoringModal — Interviewer enters 1-10 scores per trait question
 * Then can trigger the AI Fitment Report generation inline.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, Loader2, CheckCircle2, Sparkles, ChevronRight, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { psychometricApi } from '@/lib/psychometricApi';
import type { PsychometricProfile, TraitScore, FitmentReport } from '@/types/psychometric';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  positionId: string;
  onReportGenerated?: (report: FitmentReport) => void;
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Exceptional', color: 'text-emerald-400' };
  if (score >= 7) return { label: 'Strong', color: 'text-green-400' };
  if (score >= 5) return { label: 'Average', color: 'text-yellow-400' };
  if (score >= 3) return { label: 'Below Average', color: 'text-orange-400' };
  return { label: 'Poor', color: 'text-red-400' };
}

export function PsychometricScoringModal({
  open, onClose, candidateId, candidateName, positionId, onReportGenerated,
}: Props) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<PsychometricProfile | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; notes: string }>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [scoresSaved, setScoresSaved] = useState(false);
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset state on each open so re-score always starts fresh
    setScoresSaved(false);
    setScores({});
    loadProfile();
    loadExistingScores();
  }, [open, positionId, candidateId]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const p = await psychometricApi.getProfile(positionId);
      setProfile(p);
      // Initialize all traits to 5 by default
      const initial: Record<string, { score: number; notes: string }> = {};
      p.required_traits.forEach(t => {
        initial[t.trait] = { score: 5, notes: '' };
      });
      setScores(prev => ({ ...initial, ...prev }));
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadExistingScores = async () => {
    try {
      const s = await psychometricApi.getScores(candidateId);
      const mapped: Record<string, { score: number; notes: string }> = {};
      s.scores.forEach(ts => { mapped[ts.trait] = { score: ts.score, notes: ts.notes || '' }; });
      setScores(prev => ({ ...prev, ...mapped }));
      // NOTE: we do NOT set scoresSaved=true here — user must explicitly save or it auto-saves on generate
    } catch { /* no scores yet — that's fine */ }
  };

  const handleSaveScores = async (): Promise<boolean> => {
    if (!profile) return false;
    setSavingScores(true);
    try {
      const payload: TraitScore[] = profile.required_traits.map(t => ({
        trait: t.trait,
        score: scores[t.trait]?.score ?? 5,
        notes: scores[t.trait]?.notes || undefined,
      }));
      await psychometricApi.submitScores(candidateId, payload);
      setScoresSaved(true);
      toast({ title: 'Scores saved ✅', description: 'Ready to generate the Fitment Report.' });
      return true;
    } catch (err) {
      toast({ title: 'Failed to save scores', description: String(err), variant: 'destructive' });
      return false;
    } finally {
      setSavingScores(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      // ALWAYS save current scores first — never rely on cached scoresSaved flag
      const saved = await handleSaveScores();
      if (!saved) {
        setGeneratingReport(false);
        return;
      }
      const report = await psychometricApi.generateReport(candidateId);
      onReportGenerated?.(report);
      toast({ title: 'EOS-IA Report Generated 🧠', description: `Verdict: ${report.verdict.decision}` });
      onClose();
    } catch (err) {
      toast({ title: 'Report generation failed', description: String(err), variant: 'destructive' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const allScored = profile
    ? profile.required_traits.every(t => scores[t.trait]?.score !== undefined)
    : false;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">EOS-IA Psychometric Scoring</h3>
                  <p className="text-xs text-muted-foreground">{candidateName}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading psychometric profile...</span>
                </div>
              ) : !profile ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-semibold font-display">No Psychometric Profile Yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Go to the Psychometrics tab and generate the profile first.
                  </p>
                </div>
              ) : (
                <>
                  {/* Role Context */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">{profile.role_type}</Badge>
                      <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{profile.business_model}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{profile.company_context}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.key_stressors.map(s => (
                        <span key={s} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-md px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Trait Scoring */}
                  <p className="text-sm font-medium text-foreground">Score each trait (1 = Poor, 10 = Exceptional):</p>
                  {profile.required_traits.map((trait, idx) => {
                    const current = scores[trait.trait] ?? { score: 5, notes: '' };
                    const { label, color } = scoreLabel(current.score);
                    const isExpanded = expandedTrait === trait.trait;

                    return (
                      <div key={trait.trait} className="space-y-3 p-4 rounded-xl border border-border/30 bg-muted/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">Q{idx + 1}</span>
                              <p className="text-sm font-semibold text-foreground">{trait.trait}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trait.question}</p>
                          </div>
                          <button
                            onClick={() => setExpandedTrait(isExpanded ? null : trait.trait)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border/20">
                            <p className="font-medium text-foreground mb-1">Scoring Guide:</p>
                            <p>{trait.scoring_guide}</p>
                          </div>
                        )}

                        {/* Score Slider */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Slider
                              min={1} max={10} step={1}
                              value={[current.score]}
                              onValueChange={([val]) => {
                                setScoresSaved(false); // mark unsaved when slider moves
                                setScores(prev => ({ ...prev, [trait.trait]: { ...prev[trait.trait], score: val } }));
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                              <span>1 Poor</span><span>5 Avg</span><span>10 Elite</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 w-24">
                            <p className={`text-2xl font-bold font-display ${color}`}>{current.score}</p>
                            <p className={`text-xs ${color}`}>{label}</p>
                          </div>
                        </div>

                        {/* Notes */}
                        <Textarea
                          placeholder="Interviewer notes (optional)..."
                          value={current.notes}
                          onChange={e =>
                            setScores(prev => ({ ...prev, [trait.trait]: { ...prev[trait.trait], notes: e.target.value } }))
                          }
                          className="text-xs min-h-[52px] bg-background/50 border-border/40 resize-none"
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            {profile && (
              <div className="flex items-center justify-between gap-3 p-6 border-t border-border/30 shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {scoresSaved && <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Scores saved</span></>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleSaveScores} disabled={savingScores || !allScored} className="border-border/50 text-sm">
                    {savingScores ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Scores'}
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generatingReport || !allScored}
                    className="gradient-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90"
                  >
                    {generatingReport ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Report...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Generate EOS-IA Report<ChevronRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
