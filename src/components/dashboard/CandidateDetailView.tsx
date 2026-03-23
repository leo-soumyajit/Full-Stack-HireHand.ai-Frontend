import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Briefcase, Mail, CheckCircle2, AlertCircle, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiCandidate } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('hirehand-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

interface Props {
  candidateId: string;
  positionId: string;
  onBack: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function scoreColor(score: number) {
  if (score >= 8.0) return "text-emerald-400";
  if (score >= 7.0) return "text-yellow-400";
  return "text-red-400";
}

export function CandidateDetailView({ candidateId, positionId, onBack }: Props) {
  const [candidate, setCandidate] = useState<ApiCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (candidateId) {
      loadDetails();
    }
  }, [candidateId]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ApiCandidate>(`/api/positions/candidates/${candidateId}`);
      setCandidate(data);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load", description: err.message || String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!candidateId) return;
    setIsDownloading(true);
    try {
      const token = getToken();
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/positions/candidates/${candidateId}/resume`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Resume not found or not uploaded via AI screening.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidate?.name?.replace(/\s+/g, '_') || "Candidate"}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast({ title: "Success", description: "Original resume downloaded securely." });
    } catch (err: any) {
      toast({ title: "Download Failed", description: err.message || "Resume not found or not uploaded via AI screening.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm glow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-14 w-14 shrink-0 shadow-sm border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {candidate ? getInitials(candidate.name) : <Loader2 className="animate-spin h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
              {candidate?.name || "Loading Candidate..."}
              {candidate && <Badge variant="outline" className="text-xs tracking-wider uppercase font-semibold border-primary/30 text-primary bg-primary/5">{candidate.verdict}</Badge>}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center text-sm text-muted-foreground"><Briefcase className="w-3.5 h-3.5 mr-1.5" />{candidate?.role || "--"}</span>
              <span className="flex items-center text-sm text-muted-foreground"><Mail className="w-3.5 h-3.5 mr-1.5" />{candidate?.email || "--"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-12 sm:ml-0">
          <Button onClick={handleDownloadResume} disabled={isDownloading || !candidate} className="gap-2 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Original Resume
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 pb-10">
        {isLoading || !candidate ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p>Retrieving full AI analysis profile...</p>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto">
            
            {/* Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-md hover:border-primary/30 transition-colors">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">AI Resume Rating</p>
                  <h4 className={`text-4xl font-display font-bold ${scoreColor(candidate.scores.resume)}`}>
                    {candidate.scores.resume.toFixed(1)}<span className="text-sm text-muted-foreground font-medium ml-1">/ 10</span>
                  </h4>
                </div>
                <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-blue-500" />
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-md hover:border-primary/30 transition-colors">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">JD Match Accuracy</p>
                  <h4 className="text-4xl font-display font-bold text-foreground">
                    {candidate.resume_analysis?.jd_match_percent || "--"}%
                  </h4>
                </div>
                <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BrainCircuit className="h-7 w-7 text-emerald-500" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-md hover:border-primary/30 transition-colors">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Psychometric Score</p>
                  <h4 className={`text-4xl font-display font-bold ${scoreColor(candidate.scores.psych)}`}>
                    {candidate.scores.psych > 0 ? candidate.scores.psych.toFixed(1) : "Pending"}
                  </h4>
                </div>
                <div className="h-14 w-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-purple-400" />
                </div>
              </div>
            </div>

            {/* AI Analysis Sections */}
            {candidate.resume_analysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold text-emerald-400 text-lg border-b border-emerald-500/20 pb-2">
                    <CheckCircle2 className="w-5 h-5" /> Key Strengths
                  </h3>
                  <ul className="space-y-4">
                    {(candidate.resume_analysis.strengths || []).map((str, idx) => (
                      <li key={idx} className="flex gap-4 text-[15px] text-muted-foreground/90 leading-relaxed p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                        <span className="font-bold text-emerald-500/60 mt-0.5 text-lg">{(idx+1).toString().padStart(2, '0')}</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold text-red-400 text-lg border-b border-red-500/20 pb-2">
                    <AlertCircle className="w-5 h-5" /> Areas of Concern
                  </h3>
                  <ul className="space-y-4">
                    {(candidate.resume_analysis.gaps || []).map((wk, idx) => (
                      <li key={idx} className="flex gap-4 text-[15px] text-muted-foreground/90 leading-relaxed p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                        <span className="font-bold text-red-500/60 mt-0.5 text-lg">{(idx+1).toString().padStart(2, '0')}</span>
                        {wk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-16 mt-8 border-2 border-dashed border-border/50 rounded-2xl text-center bg-muted/10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">Original AI screening data unavailable for this candidate.</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Candidates added manually do not have AI screening reports.</p>
              </div>
            )}

            {/* Justification Block */}
            {candidate.resume_analysis?.verdict_rationale && (
              <div className="p-8 mt-8 rounded-2xl bg-card border border-primary/20 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-2 h-full gradient-primary" />
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <h3 className="font-semibold text-foreground mb-4 text-xl flex items-center gap-2">
                   <BrainCircuit className="w-5 h-5 text-primary" /> AI Justification Summary
                </h3>
                <p className="text-[15px] text-muted-foreground/90 leading-loose">
                  {candidate.resume_analysis.verdict_rationale}
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
