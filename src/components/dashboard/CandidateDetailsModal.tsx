import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Briefcase, Mail, CheckCircle2, AlertCircle, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiCandidate } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  candidateId: string | null;
  positionId: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function scoreColor(score: number) {
  if (score >= 8.0) return "text-emerald-400";
  if (score >= 7.0) return "text-yellow-400";
  return "text-red-400";
}

export function CandidateDetailsModal({ open, onClose, candidateId }: Props) {
  const [candidate, setCandidate] = useState<ApiCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && candidateId) {
      loadDetails();
    } else {
      setCandidate(null);
    }
  }, [open, candidateId]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/positions/candidates/${candidateId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch candidate details");
      const data = await res.json();
      setCandidate(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResume = () => {
    if (!candidateId) return;
    setIsDownloading(true);
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${API_BASE}/api/positions/candidates/${candidateId}/resume`;
    const token = localStorage.getItem("token");
    
    fetch(url, { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error("Resume not found or not uploaded via AI screening.");
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${candidate?.name?.replace(/\s+/g, '_') || "Candidate"}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Success", description: "Original resume downloaded securely." });
      })
      .catch(err => {
        toast({ title: "Download Failed", description: err.message, variant: "destructive" });
      })
      .finally(() => setIsDownloading(false));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/30 bg-muted/20">
            <div className="flex items-center gap-4">
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
            
            <div className="flex items-center gap-3">
              <Button onClick={handleDownloadResume} disabled={isDownloading || !candidate} className="gap-2 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Resume PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-6 z-10">
            {isLoading || !candidate ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Retrieving full AI analysis profile...</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Score Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">AI Resume Rating</p>
                      <h4 className={`text-3xl font-display font-bold ${scoreColor(candidate.scores.resume)}`}>
                        {candidate.scores.resume.toFixed(1)}<span className="text-sm text-muted-foreground font-medium ml-1">/ 10</span>
                      </h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">JD Match Accuracy</p>
                      <h4 className="text-3xl font-display font-bold text-foreground">
                        {candidate.resume_analysis?.jd_match_percent || "--"}%
                      </h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <BrainCircuit className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/40 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Psychometric Score</p>
                      <h4 className={`text-3xl font-display font-bold ${scoreColor(candidate.scores.psych)}`}>
                        {candidate.scores.psych > 0 ? candidate.scores.psych.toFixed(1) : "N/A"}
                      </h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* AI Analysis Sections */}
                {candidate.resume_analysis ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 font-semibold text-emerald-400 text-lg">
                        <CheckCircle2 className="w-5 h-5" /> Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {candidate.resume_analysis.strengths.map((str, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <span className="font-bold text-emerald-500/50 mt-0.5">{(idx+1).toString().padStart(2, '0')}.</span>
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 font-semibold text-red-400 text-lg">
                        <AlertCircle className="w-5 h-5" /> Areas of Concern
                      </h3>
                      <ul className="space-y-3">
                        {candidate.resume_analysis.gaps.map((wk, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                            <span className="font-bold text-red-500/50 mt-0.5">{(idx+1).toString().padStart(2, '0')}.</span>
                            {wk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-border/50 rounded-xl text-center bg-muted/20">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Original AI screening data unavailable for this candidate.</p>
                  </div>
                )}

                {/* Justification Block */}
                {candidate.resume_analysis?.verdict_rationale && (
                  <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                       AI Justification Summary
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {candidate.resume_analysis.verdict_rationale}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
