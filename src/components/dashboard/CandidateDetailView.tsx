import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Download, Briefcase, Mail, CheckCircle2, AlertCircle, Loader2, Sparkles, BrainCircuit,
  MoreVertical, Trash2, UserMinus, RotateCcw, Send, CalendarIcon, FileBarChart, Brain,
  Linkedin, Github, Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MainLoader } from "@/components/ui/main-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FitmentReportPanel } from "./FitmentReportPanel";
import { PsychometricScoringModal } from "./PsychometricScoringModal";
import { SchedulingModal } from "./SchedulingModal";
import { InterviewIntelligenceTab } from "./InterviewIntelligenceTab";
import { ApiCandidate } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, candidatesApi, assessmentApi } from "@/lib/api";
import { psychometricApi } from "@/lib/psychometricApi";
import { generateFitmentPDF } from "@/lib/generateFitmentPDF";

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
  initialTab?: string;
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

export function CandidateDetailView({ candidateId, positionId, initialTab = "resume", onBack }: Props) {
  const [candidate, setCandidate] = useState<ApiCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState(false);
  const [newlyGeneratedReport, setNewlyGeneratedReport] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("ct") || initialTab;
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { prev.set("ct", tab); return prev; }, { replace: true });
  };
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

  const handleReject = async () => {
    try {
      await candidatesApi.update(candidateId, { stage: "Rejected", verdict: "No-Go" });
      setCandidate(prev => prev ? { ...prev, stage: "Rejected", verdict: "No-Go" } : null);
      toast({ title: "Candidate rejected" });
    } catch (err) {
      toast({ title: "Failed to reject", description: String(err), variant: "destructive" });
    }
  };

  const handleRevert = async () => {
    try {
      await candidatesApi.update(candidateId, { stage: "Sourced", verdict: "Pending" });
      setCandidate(prev => prev ? { ...prev, stage: "Sourced", verdict: "Pending" } : null);
      toast({ title: "Rejection reverted" });
    } catch (err) {
      toast({ title: "Failed to revert", description: String(err), variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      // Direct pass to API fetch to skip complicated context prop drilling
      await apiFetch(`/api/positions/candidates/${candidateId}`, { method: 'DELETE' });
      toast({ title: "Candidate removed" });
      onBack();
    } catch (err) {
      toast({ title: "Delete failed", description: String(err), variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const report = await psychometricApi.getReport(candidateId);
      await generateFitmentPDF(report, candidate?.name || "Candidate", "Detailed Report");
      toast({ title: "PDF Downloaded ✅" });
    } catch {
      toast({
        title: "No Fitment Report",
        description: "Generate a psychometric report first.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDispatchAssessment = async () => {
    setDispatching(true);
    try {
      await assessmentApi.send({ position_id: positionId, candidate_id: candidateId });
      toast({ title: "Assessment Dispatched!", description: "Magic link sent to candidate successfully." });
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setDispatching(false);
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
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center text-sm text-muted-foreground"><Briefcase className="w-3.5 h-3.5 mr-1.5" />{candidate?.role || "--"}</span>
              <span className="flex items-center text-sm text-muted-foreground"><Mail className="w-3.5 h-3.5 mr-1.5" />{candidate?.email || "--"}</span>
            </div>
            {candidate?.resume_analysis?.social_links && (
              <div className="flex items-center gap-3 mt-2.5">
                {candidate.resume_analysis.social_links.github && candidate.resume_analysis.social_links.github.toLowerCase() !== "null" && candidate.resume_analysis.social_links.github.toLowerCase() !== "none" && (
                  <a href={candidate.resume_analysis.social_links.github.startsWith('http') ? candidate.resume_analysis.social_links.github : `https://${candidate.resume_analysis.social_links.github}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:underline bg-slate-500/20 px-2 py-1 rounded-md transition-colors">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-12 sm:ml-0">
          <Button onClick={handleDownloadResume} disabled={isDownloading || !candidate} className="gap-2 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Original Resume
          </Button>

          {candidate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 border border-border/40 hover:bg-muted/50 rounded-xl hover:border-border/60 transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border/50 z-50 w-56">
                <DropdownMenuItem onClick={() => setScoringModalOpen(true)} className="gap-2 cursor-pointer">
                  <Brain className="h-4 w-4 text-primary" /><span>Manual Score (Legacy)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("psychometric")} className="gap-2 cursor-pointer">
                  <FileBarChart className="h-4 w-4 text-emerald-400" /><span>View Fitment Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSchedulingModalOpen(true)} className="gap-2 cursor-pointer">
                  <CalendarIcon className="h-4 w-4 text-indigo-400" /><span>Schedule Interview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloadingPDF} className="gap-2 cursor-pointer">
                  {downloadingPDF ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : <Download className="h-4 w-4 text-blue-400" />}
                  <span>{downloadingPDF ? "Generating PDF..." : "Download PDF Report"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem onClick={handleDispatchAssessment} disabled={dispatching} className="gap-2 cursor-pointer">
                  {dispatching ? <Loader2 className="h-4 w-4 animate-spin text-purple-400" /> : <Send className="h-4 w-4 text-purple-400" />}
                  <span>{dispatching ? "Dispatching..." : "Dispatch Assessment"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                {candidate.stage !== "Rejected" && candidate.verdict !== "No-Go" ? (
                  <DropdownMenuItem onClick={handleReject} className="text-orange-400 focus:text-orange-400 focus:bg-orange-500/10 gap-2 cursor-pointer">
                    <UserMinus className="h-4 w-4" /><span>Reject Candidate</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleRevert} className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 gap-2 cursor-pointer">
                    <RotateCcw className="h-4 w-4" /><span>Undo Rejection</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 gap-2 cursor-pointer">
                  <Trash2 className="h-4 w-4" /><span>Remove</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 pb-10">
        {isLoading || !candidate ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <MainLoader text="Retrieving full AI analysis profile..." />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6 mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
                <TabsTrigger value="resume">Resume Analysis</TabsTrigger>
                <TabsTrigger value="psychometric">Fitment Report</TabsTrigger>
                <TabsTrigger value="interview">Interview Record</TabsTrigger>
              </TabsList>

              <TabsContent value="resume" className="space-y-8 mt-6">
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
            </TabsContent>

            <TabsContent value="psychometric" className="mt-6">
              <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    EOS-IA Fitment Report for {candidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive behavioral and cultural alignment analysis based on psychometric evaluation.
                  </p>
                </div>
              </div>
              
              <FitmentReportPanel
                candidateId={candidateId}
                candidateName={candidate.name}
                positionId={positionId}
                initialReport={newlyGeneratedReport}
                onOpenScoring={() => setScoringModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="interview" className="mt-6">
              <InterviewIntelligenceTab 
                positionId={positionId} 
                positionTitle={candidate.role || "Position"} 
                candidateId={candidateId} 
                candidateName={candidate.name} 
              />
            </TabsContent>
            </Tabs>
          </div>
        )}
      </ScrollArea>

      <PsychometricScoringModal
        open={scoringModalOpen}
        onClose={() => setScoringModalOpen(false)}
        candidateId={candidateId}
        candidateName={candidate?.name || ""}
        positionId={positionId}
        onReportGenerated={(r) => setNewlyGeneratedReport(r)}
      />

      {schedulingModalOpen && candidate && (
        <SchedulingModal
          open={schedulingModalOpen}
          onClose={() => setSchedulingModalOpen(false)}
          candidateId={candidate.id}
          candidateName={candidate.name}
          positionId={positionId}
          onScheduled={() => loadDetails()}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/40 max-w-md shadow-2xl glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-display flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remove Candidate?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This action will permanently delete this candidate's profile and AI screening data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="border-border/40 hover:bg-muted/50 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 text-white hover:bg-red-600 shadow-none rounded-xl font-semibold border-none"
            >
              Remove Candidate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
