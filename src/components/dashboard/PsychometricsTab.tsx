import React, { useState, useEffect } from "react";
import { Brain, Sparkles, Loader2, RefreshCw, X, Users, Trash2, Edit3, CheckCircle2, FileVideo, Clock, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { assessmentApi, candidatesApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PsychometricsTabProps {
  position: import("@/types/api").ApiPosition;
  fitmentReports: Record<string, import("@/types/psychometric").FitmentReport>;
  onOpenScoring: (candidateId: string, candidateName: string) => void;
  onViewReport: (candidateId: string, candidateName: string) => void;
}

export function PsychometricsTab({ position, fitmentReports, onOpenScoring, onViewReport }: PsychometricsTabProps) {
  const { toast } = useToast();
  const [test, setTest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);
  const [numQuestions, setNumQuestions] = useState(10);
  
  // Edit Question State
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editScenario, setEditScenario] = useState("");
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Candidates State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>({});
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);

  const hasJD = !!position.jd;

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Test
      try {
        const testData = await assessmentApi.getPositionTest(position.id);
        setTest(testData);
      } catch (e: any) {
        if (e.response?.status !== 404 && !e.message?.includes("404")) {
           console.error("Test fetch error:", e);
        }
        setTest(null);
      }
      
      // 2. Load Candidates
      const cands = await candidatesApi.list(position.id);
      // Filter out rejected ones or keep them. Let's show only active/shortlisted ones
      const activeCands = cands.filter((c: any) => c.stage !== "Rejected" && c.verdict !== "No-Go");
      setCandidates(activeCands);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [position.id]);

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      await assessmentApi.generate({
        position_id: position.id,
        time_limit_minutes: timeLimit,
        num_questions: numQuestions
      });
      toast({ title: "Assessment Generated", description: "The AI has created the MCQs successfully." });
      setShowConfig(false);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to generate test", description: err.message || String(err), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await assessmentApi.clearPositionTest(position.id);
      setTest(null);
      toast({ title: "Test Cleared", description: "The test has been entirely removed." });
    } catch (err: any) {
      toast({ title: "Failed to clear test", description: err.message || String(err), variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await assessmentApi.deleteQuestion(position.id, qId);
      setTest((prev: any) => ({
        ...prev,
        questions: prev.questions.filter((q: any) => q.id !== qId)
      }));
      toast({ title: "Question Deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete question", description: err.message || String(err), variant: "destructive" });
    }
  };

  const startEdit = (q: any) => {
    setEditingQId(q.id);
    setEditScenario(q.scenario);
    setEditOptions(JSON.parse(JSON.stringify(q.options))); // deep copy
  };

  const handleSaveEdit = async () => {
    if (!editingQId) return;
    setIsSavingEdit(true);
    try {
      await assessmentApi.updateQuestion(position.id, editingQId, {
        scenario: editScenario,
        options: editOptions
      });
      setTest((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) => q.id === editingQId ? { ...q, scenario: editScenario, options: editOptions } : q)
      }));
      toast({ title: "Question Saved" });
      setEditingQId(null);
    } catch (err: any) {
      toast({ title: "Failed to save question", description: err.message || String(err), variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSendTestToCandidate = async (candidateId: string) => {
    setSendingStates(prev => ({ ...prev, [candidateId]: true }));
    try {
      await assessmentApi.send({ position_id: position.id, candidate_id: candidateId });
      toast({ title: "Assessment Sent!", description: "Magic link dispatched to candidate." });
    } catch (err: any) {
      toast({ title: "Failed to send assessment", description: err.message || String(err), variant: "destructive" });
    } finally {
      setSendingStates(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleDispatchAll = async () => {
    const eligibleCandidates = candidates.filter(c => {
      // Don't send if they already have psych score > 0 or a generated report
      return !(fitmentReports[c.id] || (c.scores && c.scores.psych > 0));
    });

    if (eligibleCandidates.length === 0) {
      toast({ title: "No Action Needed", description: "All active candidates have already received the test." });
      return;
    }

    setIsDispatchingAll(true);
    let successCount = 0;
    
    // Asynchronous Concurrent Dispatch Mapping
    await Promise.allSettled(
      eligibleCandidates.map(async (c) => {
        setSendingStates(prev => ({ ...prev, [c.id]: true }));
        try {
          await assessmentApi.send({ position_id: position.id, candidate_id: c.id });
          successCount++;
        } catch (e) {
          console.error(`Failed to dispatch for ${c.name}`, e);
        } finally {
          setSendingStates(prev => ({ ...prev, [c.id]: false }));
        }
      })
    );
    
    setIsDispatchingAll(false);
    toast({ 
      title: "Batch Dispatch Complete", 
      description: `Successfully sent magic links to ${successCount} out of ${eligibleCandidates.length} potential candidates.` 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Assessment Ecosystem...
      </div>
    );
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
        {/* HEADER CARD */}
        <Card className="glass-strong overflow-hidden relative">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-inner">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">EOS-IA Final Assessment Interface</h3>
                <p className="text-xs text-muted-foreground">Scenario-based behavioral MCQ Test</p>
              </div>
            </div>
          </div>
          
          {!hasJD && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Save a JD first to generate the assessment.
            </div>
          )}

          {hasJD && !test && !showConfig && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Brain className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <p className="text-foreground font-semibold text-lg max-w-sm leading-tight mb-2">Configure & Generate Assessment Test</p>
              <p className="text-xs text-muted-foreground max-w-sm mb-6">Create the role-specific scenario test before sending it to candidates.</p>
              <Button onClick={() => setShowConfig(true)} className="gradient-primary text-primary-foreground px-8 shadow-lg shadow-indigo-500/20 rounded-full h-10">
                <Sparkles className="h-4 w-4 mr-2" /> Start Generation Setup
              </Button>
            </div>
          )}

          {hasJD && !test && showConfig && (
            <div className="p-8 max-w-md mx-auto relative">
               <div className="space-y-5">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-foreground">Generation Settings</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setShowConfig(false)}><X className="h-4 w-4"/></Button>
                 </div>
                 
                 <div className="space-y-3">
                   <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                     <Clock className="w-3.5 h-3.5 text-orange-400" /> Time Limit (Minutes)
                   </Label>
                   <Input 
                     type="number" min={5} max={60} value={timeLimit} 
                     onChange={e => setTimeLimit(Number(e.target.value))}
                     className="bg-background max-w-[120px]"
                   />
                 </div>

                 <div className="space-y-3">
                   <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                     <FileVideo className="w-3.5 h-3.5 text-indigo-400" /> Number of Questions
                   </Label>
                   <Input 
                     type="number" min={5} max={20} value={numQuestions} 
                     onChange={e => setNumQuestions(Number(e.target.value))}
                     className="bg-background max-w-[120px]"
                   />
                 </div>

                 <div className="pt-4 flex justify-end">
                   <Button onClick={handleGenerateTest} disabled={isGenerating} className="gradient-primary text-primary-foreground font-semibold w-full">
                     {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Generating Scenarios...</> : <><Sparkles className="w-4 h-4 mr-2"/> Generate Test Scenarios</>}
                   </Button>
                 </div>
               </div>
            </div>
          )}

          {/* RENDER TEST QUESTIONS */}
          {test && (
            <div className="p-6">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border/40 gap-4">
                 <div className="space-y-1">
                   <h2 className="text-xl font-bold font-display text-foreground">Role Assessment Active</h2>
                   <div className="flex items-center gap-3 text-xs font-medium">
                     <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 rounded">{test.time_limit_minutes} Min Limit</Badge>
                     <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 rounded">{test.questions.length} Scenarios</Badge>
                   </div>
                 </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 shadow-sm transition-all hover:-translate-y-0.5">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear All & Restart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-strong border-red-500/20 sm:max-w-[425px]">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                      <AlertDialogHeader className="relative z-10">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-xl font-display">Delete entire test?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[15px] pt-2">
                          This action cannot be undone. All AI-generated scenarios will be permanently deleted from the assessment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-6 border-t border-border/10 pt-4">
                        <AlertDialogCancel className="hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Completely
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
               </div>

               <div className="space-y-6">
                 {test.questions.map((q: any, i: number) => {
                   const isEditing = editingQId === q.id;
                   
                   return (
                     <div key={q.id} className="p-5 bg-muted/20 border border-border/40 rounded-xl space-y-4 group">
                       {/* Q Header */}
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex items-center gap-2">
                           <span className="flex-shrink-0 w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] flex items-center justify-center font-bold">Q{i+1}</span>
                           <Badge variant="outline" className="text-[10px] text-muted-foreground/80 border-border/50 uppercase tracking-widest">{q.trait_assessed}</Badge>
                         </div>
                         {!isEditing && (
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => startEdit(q)}>
                               <Edit3 className="w-3.5 h-3.5" />
                             </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70 hover:text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass-strong border-red-500/20 sm:max-w-[425px]">
                                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                                  <AlertDialogHeader className="relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                      <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <AlertDialogTitle className="text-xl font-display">Delete Scenario?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-[15px] pt-2">
                                      This AI-generated scenario will be permanently removed from the assessment.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="mt-6 border-t border-border/10 pt-4">
                                    <AlertDialogCancel className="hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)} className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete Scenario
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                           </div>
                         )}
                       </div>

                       {/* Q Body */}
                       {isEditing ? (
                         <div className="space-y-4 pt-2">
                           <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Scenario Text</Label>
                              <Input value={editScenario} onChange={e => setEditScenario(e.target.value)} className="bg-background text-sm" />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">4 Behavioral Options</Label>
                              {editOptions.map((opt, oIdx) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-muted-foreground w-4">{["A","B","C","D"][oIdx]}</span>
                                  <Input value={opt.text} onChange={e => {
                                      const no = [...editOptions];
                                      no[oIdx].text = e.target.value;
                                      setEditOptions(no);
                                  }} className="bg-background text-xs h-8" />
                                </div>
                              ))}
                           </div>
                           <div className="flex justify-end gap-2 pt-2">
                             <Button variant="ghost" size="sm" onClick={() => setEditingQId(null)} className="h-8">Cancel</Button>
                             <Button size="sm" className="h-8 gradient-primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
                               {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin"/> : "Save Edits"}
                             </Button>
                           </div>
                         </div>
                       ) : (
                         <>
                           <p className="text-sm font-semibold text-foreground leading-relaxed">{q.scenario}</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                             {q.options.map((opt: any, oIdx: number) => (
                               <div key={opt.id} className="p-3 rounded-lg border border-border/30 bg-background/50 text-[11px] leading-relaxed text-muted-foreground flex gap-2 items-start">
                                 <span className="font-mono font-bold text-foreground opacity-50">{opt.id}.</span> 
                                 <span>{opt.text}</span>
                               </div>
                             ))}
                           </div>
                         </>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CANDIDATES TABLE FOR DISPATCH */}
      {test && (
        <div className="space-y-3 pt-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Dispatch Assessment
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Send the verified test to active candidates below via 1-Click.</p>
            </div>
            {candidates.length > 0 && (
              <Button 
                onClick={handleDispatchAll} 
                className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-indigo-500/20 gap-2 h-9"
                disabled={isDispatchingAll}
              >
                {isDispatchingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isDispatchingAll ? "Dispatching to All..." : "Dispatch to All"}
              </Button>
            )}
          </div>

          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Candidate</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">App Stage</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Resume Score</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">No active candidates to send the test to.</TableCell></TableRow>
                ) : (
                  candidates.map(c => {
                    const isSending = sendingStates[c.id];
                    // Also check if they already have a > 0 score or specific generated fitment report
                    const hasReport = fitmentReports[c.id] || (c.scores && c.scores.psych > 0);

                    return (
                      <TableRow key={c.id} className="border-border/20 transition-all hover:bg-primary/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                                {getInitials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{c.stage}</Badge></TableCell>
                        <TableCell><span className="text-xs font-mono font-medium opacity-80">{c.scores?.resume?.toFixed(1) || "-"}</span></TableCell>
                        <TableCell className="text-right">
                          {hasReport ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 py-1.5 cursor-pointer hover:bg-emerald-500/20" onClick={() => onViewReport(c.id, c.name)}>
                               <CheckCircle2 className="w-3.5 h-3.5" /> Report Ready
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleSendTestToCandidate(c.id)} disabled={isSending} className="h-8 gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20">
                              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              {isSending ? "Sending..." : "Send Test Link"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
