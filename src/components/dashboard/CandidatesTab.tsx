import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Users,
  X,
  Sparkles,
  MoreVertical,
  Eye,
  Loader2,
  Trash2,
  Brain,
  FileBarChart,
  Download,
  ScanSearch,
  CalendarIcon,
  Mail,
  Send,
  UserMinus,
  RotateCcw,
} from "lucide-react";
import { ResumeScreeningModal } from "./ResumeScreeningModal";
import { SchedulingModal } from "./SchedulingModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MainLoader } from "@/components/ui/main-loader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiCandidate } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { psychometricApi } from "@/lib/psychometricApi";
import { generateFitmentPDF } from "@/lib/generateFitmentPDF";
import { emailApi } from "@/lib/emailApi";
import { assessmentApi, candidatesApi } from "@/lib/api";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const STAGES = ["Sourced", "Screened", "Interview L1", "Interview L2", "Offer", "Rejected"];

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

function scoreColor(score: number) {
  if (score >= 8.0) return "text-emerald-400";
  if (score >= 7.0) return "text-yellow-400";
  return "text-red-400";
}

interface CandidatesTabProps {
  positionId: string;
  positionTitle?: string;
  onAddCandidate: (data: { name: string; role: string; email: string; stage: string }) => Promise<ApiCandidate>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  getCandidates: (positionId: string) => Promise<ApiCandidate[]>;
  onScorePsychometric?: (candidateId: string, candidateName: string) => void;
  onViewReport?: (candidateId: string, candidateName: string) => void;
  onCandidatesLoaded?: (count: number) => void;
  onViewCandidate?: (id: string) => void;
}

export function CandidatesTab({
  positionId,
  positionTitle = "Position",
  onAddCandidate,
  onDeleteCandidate,
  getCandidates,
  onScorePsychometric,
  onViewReport,
  onViewCandidate,
  onCandidatesLoaded,
}: CandidatesTabProps) {
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", email: "", stage: "Sourced" });
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [screenResumeOpen, setScreenResumeOpen] = useState(false);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState<{ candidateId: string; candidateName: string } | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [topN, setTopN] = useState<string>("");
  const [isSendingMail, setIsSendingMail] = useState<string | false>(false);
  const [dispatchingStatus, setDispatchingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { canManageCandidates, canScreenResumes, canSendAssessment, canManageSchedules, canScorePsychometrics } = useRoleAccess();

  const displayCandidates = useMemo(() => {
    if (!candidates.length) return [];
    return [...candidates].sort((a, b) => {
      // Always push manually rejected / No-Go candidates to the bottom
      const aIsRejected = a.stage === "Rejected" || a.verdict === "No-Go";
      const bIsRejected = b.stage === "Rejected" || b.verdict === "No-Go";
      if (aIsRejected && !bIsRejected) return 1;
      if (!aIsRejected && bIsRejected) return -1;
      
      return (b.scores?.composite || 0) - (a.scores?.composite || 0);
    });
  }, [candidates]);

  const { shortlistedList, rejectedList } = useMemo(() => {
    const shortlisted: ApiCandidate[] = [];
    const rejected: ApiCandidate[] = [];
    
    let rankedIndex = 0;
    const limit = parseInt(topN, 10);
    const hasLimit = !isNaN(limit) && limit > 0;

    displayCandidates.forEach((c) => {
      const isManuallyRejected = c.stage === "Rejected" || c.verdict === "No-Go";
      const isRejectedByAI = !isManuallyRejected && hasLimit && rankedIndex >= limit;

      if (!isManuallyRejected) rankedIndex++;

      if (isManuallyRejected || isRejectedByAI) {
        rejected.push(c);
      } else {
        shortlisted.push(c);
      }
    });

    return { shortlistedList: shortlisted, rejectedList: rejected };
  }, [displayCandidates, topN]);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCandidates(positionId);
      setCandidates(data);
      onCandidatesLoaded?.(data.length);
    } catch (err) {
      toast({ title: "Failed to load candidates", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [positionId, getCandidates, onCandidatesLoaded, toast]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSendBulkMail = async (type: 'shortlist' | 'reject') => {
    const ids = type === 'shortlist' 
      ? shortlistedList.map(c => c.id)
      : rejectedList.map(c => c.id);

    if (ids.length === 0) {
      toast({ title: "No candidates", description: "No candidates in this section to email.", variant: "destructive" });
      return;
    }

    setIsSendingMail(type);
    try {
      const res = await emailApi.sendBulkMails(positionId, ids, type);
      toast({ title: "Emails Sent!", description: `Successfully dispatched ${res.sent_count} emails.` });
    } catch (err: any) {
      toast({ title: "Failed to send emails", description: err.message || String(err), variant: "destructive" });
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      const newCandidate = await onAddCandidate({
        name: form.name.trim(),
        role: form.role.trim() || "Not specified",
        email: form.email.trim(),
        stage: form.stage,
      });
      setCandidates(prev => [newCandidate, ...prev]);
      setForm({ name: "", role: "", email: "", stage: "Sourced" });
      setModalOpen(false);
      toast({ title: "Candidate added!", description: "AI scores auto-generated." });
    } catch (err) {
      toast({ title: "Failed to add candidate", description: String(err), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    const candidateId = deleteCandidateId;
    setDeleteCandidateId(null);
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    try {
      await onDeleteCandidate(candidateId);
      toast({ title: "Candidate removed" });
    } catch (err) {
      await loadCandidates();
      toast({ title: "Delete failed", description: String(err), variant: "destructive" });
    }
  };

  const handleReject = async (candidateId: string) => {
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, stage: "Rejected", verdict: "No-Go" } : c
      )
    );
    try {
      await candidatesApi.update(candidateId, { stage: "Rejected", verdict: "No-Go" });
      toast({ title: "Candidate rejected" });
    } catch (err) {
      await loadCandidates();
      toast({ title: "Failed to reject", description: String(err), variant: "destructive" });
    }
  };

  const handleRevert = async (candidateId: string) => {
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, stage: "Sourced", verdict: "Pending" } : c
      )
    );
    try {
      await candidatesApi.update(candidateId, { stage: "Sourced", verdict: "Pending" });
      toast({ title: "Rejection reverted" });
    } catch (err) {
      await loadCandidates();
      toast({ title: "Failed to revert", description: String(err), variant: "destructive" });
    }
  };

  const handleDownloadPDF = async (candidateId: string, candidateName: string) => {
    setDownloadingPDF(candidateId);
    try {
      const report = await psychometricApi.getReport(candidateId);
      await generateFitmentPDF(report, candidateName, positionTitle);
      toast({ title: "PDF Downloaded ✅", description: `${candidateName}'s Fitment Report saved.` });
    } catch {
      toast({
        title: "No Fitment Report Found",
        description: "Generate a psychometric report for this candidate first.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleDispatchAssessment = async (candidateId: string) => {
    setDispatchingStatus(prev => ({ ...prev, [candidateId]: true }));
    try {
      await assessmentApi.send({ position_id: positionId, candidate_id: candidateId });
      toast({ title: "Assessment Dispatched!", description: "Magic link sent to candidate successfully." });
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setDispatchingStatus(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const renderCandidateRow = (c: ApiCandidate, isRejectedList: boolean) => {
    const isManuallyRejected = c.stage === "Rejected" || c.verdict === "No-Go";
    const displayStage = isRejectedList && !isManuallyRejected ? "Rejected" : c.stage;
    const displayVerdict = isRejectedList && !isManuallyRejected ? "No-Go" : c.verdict;
    
    return (
      <TableRow 
        key={c.id} 
        onClick={() => onViewCandidate(c.id)}
        className={`border-border/20 transition-all cursor-pointer duration-300 ${isRejectedList ? 'hover:bg-red-950/20 grayscale hover:grayscale-0' : 'hover:bg-primary/5'}`}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                {getInitials(c.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.role}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={`text-xs ${isRejectedList && !isManuallyRejected ? 'bg-red-500/10 text-red-500 border-red-500/20' : (STAGE_COLORS[displayStage] || STAGE_COLORS["Sourced"])}`}>
            {isRejectedList && !isManuallyRejected ? 'AI Rejected' : displayStage}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <span className={`text-sm font-semibold ${scoreColor(c.scores?.resume || 0)}`}>
            {(c.scores?.resume || 0).toFixed(1)}
          </span>
        </TableCell>
        <TableCell className="text-center hidden sm:table-cell">
          <span className={`text-sm font-semibold ${scoreColor(c.scores?.psych || 0)}`}>
            {(c.scores?.psych || 0).toFixed(1)}
          </span>
        </TableCell>
        <TableCell className="text-center hidden md:table-cell">
          <span className={`text-sm font-bold ${c.scores?.composite >= 85 ? "text-emerald-400" : c.scores?.composite >= 70 ? "text-yellow-400" : "text-red-400"}`}>
            {c.scores?.composite || 0}%
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <Badge variant="outline" className={`text-xs ${isRejectedList && !isManuallyRejected ? VERDICT_COLORS["No-Go"] : (VERDICT_COLORS[displayVerdict] || VERDICT_COLORS["Pending"])}`}>
            {displayVerdict}
          </Badge>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border/50 z-50 w-56">
              <DropdownMenuItem onClick={() => onScorePsychometric?.(c.id, c.name)} className="gap-2 cursor-pointer">
                <Brain className="h-4 w-4 text-primary" /><span>Manual Score (Legacy)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewReport?.(c.id, c.name)} className="gap-2 cursor-pointer">
                <FileBarChart className="h-4 w-4 text-emerald-400" /><span>View Fitment Report</span>
              </DropdownMenuItem>
              {canManageSchedules && (
                <DropdownMenuItem onClick={() => setSchedulingModalOpen({ candidateId: c.id, candidateName: c.name })} className="gap-2 cursor-pointer">
                  <CalendarIcon className="h-4 w-4 text-indigo-400" /><span>Schedule Interview</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDownloadPDF(c.id, c.name)} disabled={downloadingPDF === c.id} className="gap-2 cursor-pointer">
                {downloadingPDF === c.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : <Download className="h-4 w-4 text-blue-400" />}
                <span>{downloadingPDF === c.id ? "Generating PDF..." : "Download PDF Report"}</span>
              </DropdownMenuItem>
              {canSendAssessment && (
                <>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem onClick={() => handleDispatchAssessment(c.id)} disabled={dispatchingStatus[c.id] || isManuallyRejected} className="gap-2 cursor-pointer">
                    {dispatchingStatus[c.id] ? <Loader2 className="h-4 w-4 animate-spin text-purple-400" /> : <Send className="h-4 w-4 text-purple-400" />}
                    <span>{dispatchingStatus[c.id] ? "Dispatching..." : "Dispatch Assessment"}</span>
                  </DropdownMenuItem>
                </>
              )}
              {canManageCandidates && (
                <>
                  <DropdownMenuSeparator className="bg-border/40" />
                  {!isManuallyRejected ? (
                    <DropdownMenuItem onClick={() => handleReject(c.id)} className="text-orange-400 focus:text-orange-400 focus:bg-orange-500/10 gap-2 cursor-pointer">
                      <UserMinus className="h-4 w-4" /><span>Reject Candidate</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleRevert(c.id)} className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 gap-2 cursor-pointer">
                      <RotateCcw className="h-4 w-4" /><span>Undo Rejection</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setDeleteCandidateId(c.id)} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 gap-2 cursor-pointer">
                    <Trash2 className="h-4 w-4" /><span>Remove</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <div className="py-14">
        <MainLoader text="Loading candidates..." />
      </div>
    );
  }

  if (candidates.length === 0 && !modalOpen) {
    return (
      <>
        <Card className="glass-strong">
          <CardContent className="p-12 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted mb-4">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground font-display">No Candidates Yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Screen resumes with AI or add manually.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {canScreenResumes && (
                <Button
                  onClick={() => setScreenResumeOpen(true)}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                >
                  <ScanSearch className="h-4 w-4 mr-1.5" /> Screen Resume with AI
                </Button>
              )}
              {canManageCandidates && (
                <Button onClick={() => setModalOpen(true)} className="gradient-primary text-primary-foreground font-semibold">
                  <UserPlus className="h-4 w-4 mr-1" /> Add Candidate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <AddCandidateModal
          open={modalOpen}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
          isSaving={isSaving}
        />
        <ResumeScreeningModal
          open={screenResumeOpen}
          onClose={() => setScreenResumeOpen(false)}
          positionId={positionId}
          positionTitle={positionTitle}
          onCandidateAdded={() => loadCandidates()}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing <span className="text-foreground font-medium">{candidates.length}</span> candidates
          </p>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40">
              <Brain className="h-4 w-4 text-primary" />
              <Label htmlFor="top-n" className="text-xs font-medium text-muted-foreground whitespace-nowrap">AI Top:</Label>
              <Input
                id="top-n"
                type="number"
                min="1"
                max={candidates.length.toString()}
                placeholder="All"
                value={topN}
                onChange={(e) => setTopN(e.target.value)}
                className="w-16 h-7 text-xs px-2 text-center bg-background border-border"
              />
            </div>
            
            {canScreenResumes && (
              <Button
                onClick={() => setScreenResumeOpen(true)}
                size="sm"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
              >
                <ScanSearch className="h-4 w-4 mr-1.5" /> Screen Resume with AI
              </Button>
            )}
            {canManageCandidates && (
              <Button onClick={() => setModalOpen(true)} size="sm" className="gradient-primary text-primary-foreground font-semibold">
                <UserPlus className="h-4 w-4 mr-1" /> Add Candidate
              </Button>
            )}
          </div>
        </div>

        {shortlistedList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Shortlisted Candidates ({shortlistedList.length})
              </h3>
              {canManageCandidates && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="font-semibold gap-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  disabled={isSendingMail === 'shortlist'}
                  onClick={() => handleSendBulkMail('shortlist')}
                >
                  {isSendingMail === 'shortlist' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Shortlist Mail
                </Button>
              )}
            </div>
            <Card className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Candidate</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Stage</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Resume</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center hidden sm:table-cell">Psych</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center hidden md:table-cell">Composite</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hidden lg:table-cell">Verdict</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shortlistedList.map(c => renderCandidateRow(c, false))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {rejectedList.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Unselected / Rejected ({rejectedList.length})
              </h3>
              {canManageCandidates && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="font-semibold gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  disabled={isSendingMail === 'reject'}
                  onClick={() => handleSendBulkMail('reject')}
                >
                  {isSendingMail === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Rejection Mail
                </Button>
              )}
            </div>
            <Card className="glass-card overflow-hidden opacity-90">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Candidate</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Stage</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Resume</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center hidden sm:table-cell">Psych</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center hidden md:table-cell">Composite</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hidden lg:table-cell">Verdict</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedList.map(c => renderCandidateRow(c, true))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>

      <AddCandidateModal
        open={modalOpen}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
        isSaving={isSaving}
      />
      <ResumeScreeningModal
        open={screenResumeOpen}
        onClose={() => setScreenResumeOpen(false)}
        positionId={positionId}
        positionTitle={positionTitle}
        onCandidateAdded={(id) => {
          loadCandidates();
          setScreenResumeOpen(false);
          if (onViewCandidate) onViewCandidate(id);
        }}
      />
      {schedulingModalOpen && (
        <SchedulingModal
          open={!!schedulingModalOpen}
          onClose={() => setSchedulingModalOpen(null)}
          candidateId={schedulingModalOpen.candidateId}
          candidateName={schedulingModalOpen.candidateName}
          positionId={positionId}
          onScheduled={() => loadCandidates()}
        />
      )}
      <AlertDialog open={!!deleteCandidateId} onOpenChange={(open) => !open && setDeleteCandidateId(null)}>
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
    </>
  );
}

interface ModalProps {
  open: boolean;
  form: { name: string; role: string; email: string; stage: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; role: string; email: string; stage: string }>>;
  onSubmit: () => void;
  onClose: () => void;
  isSaving: boolean;
}

function AddCandidateModal({ open, form, setForm, onSubmit, onClose, isSaving }: ModalProps) {
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
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-card border border-border/40 rounded-2xl shadow-2xl glow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <UserPlus className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">Add Candidate</h3>
                  <p className="text-xs text-muted-foreground">AI will auto-generate scores</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Full Name</Label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Current Role / Company</Label>
                <Input
                  placeholder="e.g. Staff Engineer @ InnovateTech"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="e.g. priya@innovatetech.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v }))}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 z-50">
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={onSubmit}
                disabled={!form.name.trim() || isSaving}
                className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                {isSaving ? "Saving..." : "Add & Generate Scores"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
