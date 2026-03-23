/**
 * ResumeScreeningModal — AI Resume Intelligence powered by EOS-IA
 * Drag & drop PDF → AI analyzes vs JD → candidate auto-added
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, FileText, Brain, CheckCircle2, XCircle,
  AlertCircle, Sparkles, Loader2, ChevronRight, TrendingUp,
  AlertTriangle, User, Mail, Briefcase, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { screenResume, type ResumeAnalysis } from "@/lib/resumeApi";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  positionId: string;
  positionTitle: string;
  onCandidateAdded?: (candidateId: string, analysis: ResumeAnalysis) => void;
}

const VERDICT_CONFIG = {
  "STRONG FIT": {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
  },
  "POTENTIAL FIT": {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    icon: AlertCircle,
    glow: "shadow-yellow-500/20",
  },
  "WEAK FIT": {
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    icon: AlertTriangle,
    glow: "shadow-orange-500/20",
  },
  "NOT SUITABLE": {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    icon: XCircle,
    glow: "shadow-red-500/20",
  },
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const pct = score / 10;
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = score >= 8 ? "#34d399" : score >= 6 ? "#fbbf24" : score >= 4 ? "#fb923c" : "#f87171";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2535" strokeWidth={6} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={6} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-black font-mono" style={{ color }}>{score}</p>
        <p className="text-[9px] text-muted-foreground leading-none">/10</p>
      </div>
    </div>
  );
}

function MatchBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "bg-emerald-500" : percent >= 60 ? "bg-yellow-500" : percent >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">JD Match</span>
        <span className="text-xs font-bold text-foreground">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export function ResumeScreeningModal({
  open, onClose, positionId, positionTitle, onCandidateAdded,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Store pre-read file data immediately on selection — File references go stale
  // (NotReadableError) if read asynchronously later after the event loop.
  const [fileData, setFileData] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ analysis: ResumeAnalysis; candidateId: string | null } | null>(null);

  const reset = () => {
    setFileData(null);
    setResult(null);
    setAnalyzing(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Read file using FileReader — more reliable than arrayBuffer() on Windows/Chrome
  const readToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is "data:application/pdf;base64,..." — strip the prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error('File could not be read'));
      reader.readAsDataURL(f);
    });

  // Read the file to base64 IMMEDIATELY — never store the File object itself.
  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Only PDF files supported", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "PDF must be under 10 MB", variant: "destructive" });
      return;
    }
    try {
      const base64 = await readToBase64(f);
      setFileData({ name: f.name, size: f.size, base64 });
      setResult(null);
    } catch {
      toast({ title: "Could not read file", description: "Please use the Browse button to select the file.", variant: "destructive" });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!fileData) return;
    setAnalyzing(true);
    try {
      // base64 is already computed — no risk of stale File reference
      const res = await screenResume(positionId, fileData.base64, fileData.name, true);
      setResult({ analysis: res.analysis, candidateId: res.candidate_id });
      if (res.candidate_id) {
        onCandidateAdded?.(res.candidate_id, res.analysis);
        toast({
          title: `${res.analysis.candidate_name} added! 🎉`,
          description: `${res.analysis.verdict} — Resume Score: ${res.analysis.resume_score}/10`,
        });
      }
    } catch (err) {
      toast({ title: "Analysis failed", description: String(err), variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const analysis = result?.analysis;
  const verdictCfg = analysis
    ? VERDICT_CONFIG[analysis.verdict as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG["POTENTIAL FIT"]
    : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.24 }}
            className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">AI Resume Screening</h3>
                  <p className="text-xs text-muted-foreground">{positionTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Upload Zone */}
              {!result && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !fileData && fileInputRef.current?.click()}
                  className={`
                    relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                    ${isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-primary/5"}
                    ${fileData ? "cursor-default" : ""}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                    {fileData ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{fileData.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(fileData.size / 1024).toFixed(0)} KB · PDF ✓ Ready
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setFileData(null); }}
                          className="text-xs text-muted-foreground hover:text-red-400"
                        >
                          Remove
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDragging ? "bg-primary/20" : "bg-muted/60"}`}>
                          <Upload className={`h-6 w-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {isDragging ? "Drop it here!" : "Drag & drop resume PDF"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">or use the button below</p>
                        </div>
                        {/* Prominent browse button — always reliable on Windows */}
                        <Button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="gradient-primary text-primary-foreground font-semibold px-6"
                        >
                          <FileText className="h-4 w-4 mr-2" /> Browse PDF File
                        </Button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary/80 bg-primary/5">
                            <Brain className="h-3 w-3 mr-1" /> AI Analysis
                          </Badge>
                          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                            Auto-rank candidates
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Analyzing state */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-10 gap-4"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full gradient-primary opacity-20 animate-pulse absolute inset-0" />
                    <div className="flex h-20 w-20 items-center justify-center">
                      <Brain className="h-9 w-9 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base font-semibold text-foreground font-display">Analyzing Resume...</p>
                    <p className="text-sm text-muted-foreground">AI is comparing against your JD</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 0.15, 0.3].map((d) => (
                      <motion.div
                        key={d}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                        className="h-2 w-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Summary */}
              {analysis && verdictCfg && !analyzing && (
                <div className="py-12 text-center flex flex-col items-center">
                   <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mb-4">
                     <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                   </div>
                   <h2 className="text-xl font-bold font-display text-foreground mb-2">Analysis Complete!</h2>
                   <p className="text-muted-foreground mb-6">Taking you to the detailed candidate profile...</p>
                   <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Footer */}
            {fileData && !result && !analyzing && (
              <div className="flex items-center justify-between gap-3 p-6 border-t border-border/30 shrink-0">
                <p className="text-xs text-muted-foreground">
                  AI will analyze vs <span className="text-foreground font-medium">{positionTitle}</span> JD
                </p>
                <Button
                  onClick={handleAnalyze}
                  className="gradient-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Resume
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
