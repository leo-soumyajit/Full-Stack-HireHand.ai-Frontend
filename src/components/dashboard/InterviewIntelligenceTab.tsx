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
  Download,
  Mail,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  interviewIntelligenceApi,
  type InterviewAnalysisListItem,
  type InterviewAnalysisFull,
} from "@/lib/interviewIntelligenceApi";
import { PrintableInterviewReport, type PrintConfig } from "./PrintableInterviewReport";

interface Props {
  positionId: string;
  positionTitle: string;
  candidateId?: string;
  candidateName?: string;
}

type ReportTab = "interviewer" | "candidate" | "quality" | "transcript";

export function InterviewIntelligenceTab({ positionId, positionTitle, candidateId, candidateName }: Props) {
  const [analyses, setAnalyses] = useState<InterviewAnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InterviewAnalysisFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportTab, setReportTab] = useState<ReportTab>("interviewer");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTargetAddress, setEmailTargetAddress] = useState("");
  const [emailMessageBody, setEmailMessageBody] = useState("");
  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    overview: true,
    candidateFeedback: true,
    interviewerQuality: true,
    transcript: true
  });
  const printRef = useRef<HTMLDivElement>(null);

  const handleSendEmail = async () => {
    if (!printRef.current || !detail || !emailTargetAddress) return;
    setIsSendingEmail(true);
    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [15, 0, 15, 0],
        filename: `HireHand_Report_${detail.candidate_name}_L${detail.interview_round ?? 1}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      
      printRef.current.style.display = "block";
      await new Promise((resolve) => setTimeout(resolve, 50));
      const pdfBase64 = await html2pdf().from(printRef.current).set(opt).output('datauristring');
      
      let senderName = "HireHand Recruiter";
      let senderEmail = "updates@hirehand.ai";
      let companyName = "HireHand AI";
      try {
        const authData = localStorage.getItem('hirehand-auth-storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          const user = parsed?.state?.user;
          if (user) {
             senderName = user.name || senderName;
             senderEmail = user.email || senderEmail;
             companyName = user.company_name || companyName;
          }
        }
      } catch (e) {
        console.error("Failed to parse auth data", e);
      }

      await interviewIntelligenceApi.sendReport(detail.id, {
        to_email: emailTargetAddress,
        message_body: emailMessageBody,
        sender_name: senderName,
        sender_email: senderEmail,
        company_name: companyName,
        pdf_base64: pdfBase64,
      });

      setIsSendEmailDialogOpen(false);
      setEmailStep(1);
      setEmailTargetAddress("");
      setEmailMessageBody("");
      // Add a small success effect
      const successMsg = document.createElement("div");
      successMsg.innerText = "Report Sent Successfully!";
      successMsg.className = "fixed bottom-5 right-5 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg font-medium z-50 animate-in fade-in slide-in-from-bottom-5";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 4000);
    } catch (e: any) {
      console.error("Email send failed:", e);
      let errMsg = "Failed to send report. Request might be too large or network error.";
      if (e?.response?.status === 413) {
        errMsg = "Error 413: Generated PDF is too large to send. Reduce selected sections.";
      }
      setEmailError(errMsg);
    } finally {
      setIsSendingEmail(false);
      if (printRef.current) printRef.current.style.display = "none";
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !detail) return;
    setIsDownloading(true);
    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [15, 0, 15, 0],
        filename: `HireHand_Report_${detail.candidate_name}_L${detail.interview_round ?? 1}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      
      printRef.current.style.display = "block";
      // Allow browser to calculate layout and paint before html2canvas captures
      await new Promise((resolve) => setTimeout(resolve, 50));
      await html2pdf().from(printRef.current).set(opt).save();
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsDownloading(false);
      if (printRef.current) printRef.current.style.display = "none";
    }
  };

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = await interviewIntelligenceApi.listForPosition(positionId);
      if (candidateId) {
        data = data.filter(a => a.candidate_id === candidateId || (candidateName && a.candidate_name === candidateName));
      }
      setAnalyses(data);
      // Auto-open the LATEST interview round (highest round number)
      if (candidateId && data.length > 0 && !selectedId) {
        const sorted = [...data].sort((a, b) => (b.interview_round ?? 0) - (a.interview_round ?? 0));
        openDetail(sorted[0].id);
      }
    } catch (err) {
      console.error("Failed to load analyses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [positionId, candidateId, candidateName]);

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
        {/* Back Button - Only show if not in Candidate Profile mode */}
        {!candidateId && (
          <button
            onClick={() => { setSelectedId(null); setDetail(null); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to analyses
          </button>
        )}

        {/* Round Switcher — shown when candidate has multiple interview rounds */}
        {candidateId && analyses.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">Interview Rounds:</span>
            {[...analyses]
              .sort((a, b) => (a.interview_round ?? 1) - (b.interview_round ?? 1))
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => openDetail(a.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedId === a.id
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-muted/30 border border-transparent hover:border-border/40"
                  }`}
                >
                  L{a.interview_round ?? 1}
                  {a.overall_score != null && (
                    <span className={`ml-1.5 ${scoreColor(a.overall_score)}`}>
                      ({a.overall_score})
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground font-display">{detail.candidate_name}</h2>
              <Badge variant="outline" className="text-xs font-bold bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                L{detail.interview_round ?? 1}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {detail.position_title} · {Math.round(detail.duration_seconds / 60)} min · {detail.created_at?.slice(0, 10)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 bg-muted/30 border-border/60 hover:bg-muted/50 hidden sm:flex"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={isDownloading || isSendingEmail}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isDownloading ? "Generating PDF..." : "Download Report"}
            </Button>
            <Button 
              size="sm" 
              className="h-10 bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hidden sm:flex border-none"
              onClick={() => setIsSendEmailDialogOpen(true)}
              disabled={isDownloading || isSendingEmail}
            >
              {isSendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              {isSendingEmail ? "Sending..." : "Send Mail"}
            </Button>
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
            { id: "transcript" as ReportTab, label: "Full Transcript", icon: FileText },
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
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await interviewIntelligenceApi.retryAnalysis(selectedId!);
                      // Reload the detail to show processing state
                      openDetail(selectedId!);
                    } catch (e) {
                      console.error("Retry failed:", e);
                    }
                  }}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Retry Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div key={reportTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {reportTab === "interviewer" && <InterviewerReportView report={ir} />}
              {reportTab === "candidate" && <CandidateReportView report={cr} tabSwitches={detail.tab_switch_count} />}
              {reportTab === "quality" && <QualityReportView report={iq} />}
              {reportTab === "transcript" && <TranscriptView transcript={detail.transcript} parsedQA={detail.parsed_transcript} candidateName={detail.candidate_name} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden template for PDF export — rendered absolutely behind UI to avoid flashing or layout shifts, but visible enough for html2canvas */}
        <div style={{ display: "none", position: "absolute", top: 0, left: 0, zIndex: -100 }}>
          <PrintableInterviewReport ref={printRef} detail={detail} config={printConfig} />
        </div>

        {/* Export Configuration Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-400" /> Export Custom Report
              </DialogTitle>
              <DialogDescription>
                Select the sections you want to include in your generated PDF.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="space-y-0.5 mr-4">
                  <h4 className="font-medium text-foreground">Overview & Recruiter Summary</h4>
                  <p className="text-xs text-muted-foreground">Candidate profile, overall score, and exec summary.</p>
                </div>
                <Switch 
                  checked={printConfig.overview} 
                  onCheckedChange={(c) => setPrintConfig(p => ({ ...p, overview: c }))} 
                />
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="space-y-0.5 mr-4">
                  <h4 className="font-medium text-foreground">Candidate Feedback</h4>
                  <p className="text-xs text-muted-foreground">Strengths, improvements, and interview tips.</p>
                </div>
                <Switch 
                  checked={printConfig.candidateFeedback} 
                  onCheckedChange={(c) => setPrintConfig(p => ({ ...p, candidateFeedback: c }))} 
                />
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="space-y-0.5 mr-4">
                  <h4 className="font-medium text-foreground">Interviewer Quality Audit</h4>
                  <p className="text-xs text-muted-foreground">Coverage gaps, bias indicators, and JD alignment.</p>
                </div>
                <Switch 
                  checked={printConfig.interviewerQuality} 
                  onCheckedChange={(c) => setPrintConfig(p => ({ ...p, interviewerQuality: c }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 mr-4">
                  <h4 className="font-medium text-foreground">Full Interview Transcript</h4>
                  <p className="text-xs text-muted-foreground">Complete Q&A trace from the live interview.</p>
                </div>
                <Switch 
                  checked={printConfig.transcript} 
                  onCheckedChange={(c) => setPrintConfig(p => ({ ...p, transcript: c }))} 
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
               <Button variant="ghost" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
               <Button onClick={() => {
                   setIsExportDialogOpen(false);
                   handleDownloadPdf();
               }} className="bg-indigo-600 hover:bg-indigo-500 text-white" disabled={!printConfig.overview && !printConfig.candidateFeedback && !printConfig.interviewerQuality && !printConfig.transcript}>
                  <FileText className="h-4 w-4 mr-2" /> Generate PDF
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Email Modal */}
        <Dialog 
          open={isSendEmailDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
               setEmailStep(1);
               setEmailError(null);
            }
            setIsSendEmailDialogOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between mt-2">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Send className="h-5 w-5 text-indigo-400" /> Share Interview Report
                </DialogTitle>
                <div className="flex items-center bg-muted/50 rounded-full p-1 text-xs font-semibold mr-6">
                  <span className={`px-2.5 py-1 rounded-full mix-blend-multiply ${emailStep === 1 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>1. Details</span>
                  <span className={`px-2.5 py-1 rounded-full mix-blend-multiply ${emailStep === 2 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>2. Content</span>
                </div>
              </div>
              <DialogDescription>
                {emailStep === 1 ? "Start by providing the recipient details and a customized message." : "Select which sections of the AI assessment you want to attach as a PDF."}
              </DialogDescription>
            </DialogHeader>

            <div className="relative overflow-hidden w-full">
              <AnimatePresence mode="wait">
                {emailStep === 1 ? (
                  <motion.div 
                    key="step-1"
                    initial={{ x: "-100%", opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="flex flex-col gap-6 py-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="to_email" className="text-foreground font-medium flex justify-between">
                        To Email
                        <span className="text-xs text-muted-foreground font-normal">Use commas for multiple</span>
                      </Label>
                      <Input 
                        id="to_email" 
                        placeholder="recipient1@example.com, recipient2@example.com" 
                        value={emailTargetAddress}
                        onChange={(e) => setEmailTargetAddress(e.target.value)}
                        className="bg-muted/30 border-border/60 focus-visible:ring-indigo-500/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-foreground font-medium">Custom Message (Optional)</Label>
                      <Textarea 
                        id="message" 
                        placeholder="e.g. Here is the detailed AI assessment report for the candidate..." 
                        value={emailMessageBody}
                        onChange={(e) => setEmailMessageBody(e.target.value)}
                        className="bg-muted/30 border-border/60 min-h-[140px] resize-none focus-visible:ring-indigo-500/30"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step-2"
                    initial={{ x: "100%", opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="flex flex-col gap-4 py-4"
                  >
                    {emailError && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-start gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Sending Failed</span>
                          {emailError}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="bg-muted/20 border border-border/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold mb-4 text-indigo-400/80 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Report Sections to Attach
                      </h4>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-border/20 pb-3">
                          <div className="space-y-0.5 max-w-[85%]">
                            <h4 className="font-medium text-sm text-foreground">Overview & Recruiter Summary</h4>
                            <p className="text-xs text-muted-foreground truncate">Candidate profile and overall score</p>
                          </div>
                          <Switch checked={printConfig.overview} onCheckedChange={(c) => setPrintConfig(p => ({ ...p, overview: c }))} />
                        </div>
                        <div className="flex items-center justify-between border-b border-border/20 pb-3">
                          <div className="space-y-0.5 max-w-[85%]">
                            <h4 className="font-medium text-sm text-foreground">Candidate Feedback</h4>
                            <p className="text-xs text-muted-foreground truncate">Strengths, improvements, tips</p>
                          </div>
                          <Switch checked={printConfig.candidateFeedback} onCheckedChange={(c) => setPrintConfig(p => ({ ...p, candidateFeedback: c }))} />
                        </div>
                        <div className="flex items-center justify-between border-b border-border/20 pb-3">
                          <div className="space-y-0.5 max-w-[85%]">
                            <h4 className="font-medium text-sm text-foreground">Interviewer Quality Audit</h4>
                            <p className="text-xs text-muted-foreground truncate">Coverage gaps, bias indicators</p>
                          </div>
                          <Switch checked={printConfig.interviewerQuality} onCheckedChange={(c) => setPrintConfig(p => ({ ...p, interviewerQuality: c }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 max-w-[85%]">
                            <h4 className="font-medium text-sm text-foreground">Full Interview Transcript</h4>
                            <p className="text-xs text-muted-foreground truncate">Complete Q&A trace</p>
                          </div>
                          <Switch checked={printConfig.transcript} onCheckedChange={(c) => setPrintConfig(p => ({ ...p, transcript: c }))} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="mt-4 flex flex-row items-center border-t border-border/30 pt-4">
               {emailStep === 1 ? (
                 <div className="w-full flex justify-end gap-3">
                   <Button variant="ghost" onClick={() => setIsSendEmailDialogOpen(false)}>Cancel</Button>
                   <Button 
                     onClick={() => setEmailStep(2)} 
                     className="bg-indigo-600 hover:bg-indigo-500 text-white" 
                     disabled={!emailTargetAddress}
                   >
                     Continue <ChevronRight className="h-4 w-4 ml-1" />
                   </Button>
                 </div>
               ) : (
                 <div className="w-full flex justify-between gap-3">
                   <Button variant="outline" onClick={() => { setEmailStep(1); setEmailError(null); }} className="bg-background" disabled={isSendingEmail}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                   </Button>
                   <Button 
                     onClick={handleSendEmail} 
                     className="bg-indigo-600 hover:bg-indigo-500 text-white" 
                     disabled={isSendingEmail || (!printConfig.overview && !printConfig.candidateFeedback && !printConfig.interviewerQuality && !printConfig.transcript)}
                   >
                      {isSendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      {isSendingEmail ? "Securing & Sending..." : "Send Final Email"}
                   </Button>
                 </div>
               )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // If candidate mode and no interview found
  if (candidateId && analyses.length === 0 && !isLoading) {
    return (
      <div className="py-16 mt-8 border-2 border-dashed border-border/50 rounded-2xl text-center bg-muted/10">
        <Video className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No Interview Intelligence found.</p>
        <p className="text-sm text-muted-foreground/60 mt-2">This candidate hasn't completed an AI interview yet.</p>
      </div>
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
                      <Badge variant="outline" className="text-[10px] shrink-0 font-bold bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        L{a.interview_round ?? 1}
                      </Badge>
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

function CandidateReportView({ report, tabSwitches = 0 }: { report: any; tabSwitches?: number }) {
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

      {/* Integrity Tracking */}
      {tabSwitches > 0 && (
        <Card className="glass-card border-red-500/20 bg-red-500/5">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Integrity Warning
            </h3>
            <p className="text-sm text-red-400/90 leading-relaxed">
              We detected that the candidate switched tabs or minimized the browser <span className="font-bold">{tabSwitches}</span> times during the interview. This behavior may indicate unauthorized assistance.
            </p>
          </CardContent>
        </Card>
      )}

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


// ══════════════════════════════════════════════════════════════════════
// TRANSCRIPT VIEW — Full interview conversation history
// ══════════════════════════════════════════════════════════════════════
function TranscriptView({ transcript, parsedQA, candidateName }: { transcript: string; parsedQA?: any; candidateName: string }) {
  const [viewMode, setViewMode] = useState<"chat" | "qa">("chat");

  // Parse raw transcript into chat messages
  const chatMessages = (transcript || "").split("\n").filter(l => l.trim()).map((line, i) => {
    // Format: [HH:MM:SS] Speaker: Text
    const match = line.match(/^\[?([\d:]+)\]?\s*(.+?):\s*(.+)$/);
    if (match) {
      return { id: i, time: match[1], speaker: match[2].trim(), text: match[3].trim() };
    }
    return { id: i, time: "", speaker: "Unknown", text: line.trim() };
  });

  // Support backwards compatibility: older AI parsed_transcripts returned lists directly or JSON strings, newer return dicts with parsed_qa
  let parsedQaData = parsedQA;
  if (typeof parsedQA === 'string') {
    try {
      parsedQaData = JSON.parse(parsedQA);
    } catch (e) {
      console.error("Failed to parse QA string", e);
    }
  }
  const qaList = Array.isArray(parsedQaData) ? parsedQaData : (parsedQaData?.parsed_qa || []);

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("chat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "chat"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground bg-muted/30"
          }`}
        >
          💬 Chat View
        </button>
          <button
            onClick={() => setViewMode("qa")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "qa"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground bg-muted/30"
            }`}
          >
            📋 Q&A Pairs
          </button>
        <span className="text-xs text-muted-foreground ml-auto">
          {viewMode === "chat" ? `${chatMessages.length} messages` : `${qaList.length} questions`}
        </span>
      </div>

      {viewMode === "chat" ? (
        /* ── Chat View ────────────────────────────────────────────── */
        <Card className="glass-card">
          <div
            className="p-4 space-y-3"
            style={{ maxHeight: "65vh", overflowY: "auto", overscrollBehavior: "contain" }}
            onWheel={(e) => {
              // Force scroll inside this container, prevent parent from stealing wheel events
              e.stopPropagation();
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            {chatMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No transcript available</p>
            ) : (
              chatMessages.map((msg) => {
                const isCandidate = msg.speaker.toLowerCase().includes("candidate") || 
                                    msg.speaker.toLowerCase() === candidateName.toLowerCase();
                return (
                  <div key={msg.id} className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isCandidate
                          ? "bg-primary/15 border border-primary/20 rounded-br-md"
                          : "bg-muted/50 border border-border/30 rounded-bl-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${isCandidate ? "text-primary" : "text-foreground/70"}`}>
                          {msg.speaker}
                        </span>
                        {msg.time && <span className="text-[10px] text-muted-foreground">{msg.time}</span>}
                      </div>
                      <p className="text-sm text-foreground/90">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      ) : (
        /* ── Q&A Pairs View ───────────────────────────────────────── */
        <div className="space-y-4">
          {qaList.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <p className="text-muted-foreground text-sm font-semibold mb-1">No Q&A Pairs Detected</p>
                <p className="text-muted-foreground/60 text-xs">The AI couldn't extract structured question and answer pairs from this transcript (e.g. if the interview was too short or unstructured).</p>
              </CardContent>
            </Card>
          ) : (
            qaList.map((qa: any, i: number) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Q{qa.question_number || i + 1}</Badge>
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{qa.topic_category || "General"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-semibold">INTERVIEWER</p>
                    <p className="text-sm text-foreground">{qa.interviewer_question}</p>
                  </div>
                  <div className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs text-muted-foreground mb-1 font-semibold">CANDIDATE</p>
                    <p className="text-sm text-foreground/90">{qa.candidate_answer}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Metadata */}
      {parsedQA && (
        <Card className="glass-card">
          <CardContent className="p-4 flex flex-wrap gap-4">
            {parsedQA.total_questions && (
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{parsedQA.total_questions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Questions</p>
              </div>
            )}
            {parsedQA.conversation_quality && (
              <div className="text-center">
                <p className={`text-lg font-bold ${parsedQA.conversation_quality === "HIGH" ? "text-emerald-400" : parsedQA.conversation_quality === "MEDIUM" ? "text-amber-400" : "text-red-400"}`}>
                  {parsedQA.conversation_quality}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
              </div>
            )}
            {parsedQA.key_topics_discussed && (
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Topics Covered</p>
                <div className="flex flex-wrap gap-1">
                  {parsedQA.key_topics_discussed.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
