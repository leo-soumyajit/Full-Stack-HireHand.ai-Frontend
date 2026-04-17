import React, { useState, useEffect, useMemo } from "react";
import { Brain, Sparkles, Loader2, RefreshCw, X, Users, Trash2, Edit3, CheckCircle2, FileVideo, Clock, Send, AlertTriangle, Layers, Shuffle, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
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

const QUESTION_TYPES = [
  { id: "Scenario", label: "Scenario-Based", icon: "🎭", desc: "Realistic workplace situations with behavioral choices", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { id: "Conventional", label: "Conventional", icon: "📋", desc: "Direct personality & work-style preference questions", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "Math & Aptitude", label: "Math & Aptitude", icon: "🧮", desc: "Numerical reasoning, logic puzzles & analytical problems", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "Behavioral", label: "Behavioral", icon: "🧠", desc: "\"How would you handle...\" style behavioral MCQs", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "Logical Reasoning", label: "Logical Reasoning", icon: "🧩", desc: "Deductive logic, syllogisms, pattern sequences & argument evaluation", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { id: "Hybrid", label: "Hybrid Mix", icon: "🔀", desc: "Custom mix — control how many of each type", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
] as const;

const HYBRID_CATEGORIES = [
  { key: "Scenario", label: "Scenario-Based", emoji: "🎭", color: "bg-violet-500" },
  { key: "Conventional", label: "Conventional", emoji: "📋", color: "bg-blue-500" },
  { key: "Math & Aptitude", label: "Math & Aptitude", emoji: "🧮", color: "bg-emerald-500" },
  { key: "Behavioral", label: "Behavioral", emoji: "🧠", color: "bg-amber-500" },
  { key: "Logical Reasoning", label: "Logical Reasoning", emoji: "🧩", color: "bg-cyan-500" },
] as const;

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
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState<string>("Scenario");
  const [hybridDist, setHybridDist] = useState<Record<string, number>>({
    "Scenario": 3,
    "Conventional": 2,
    "Math & Aptitude": 2,
    "Behavioral": 2,
    "Logical Reasoning": 1,
  });
  
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

  // Auto-sync hybrid total with numQuestions
  const hybridTotal = useMemo(() => Object.values(hybridDist).reduce((a, b) => a + b, 0), [hybridDist]);
  
  useEffect(() => {
    if (questionType === "Hybrid") {
      setNumQuestions(hybridTotal);
    }
  }, [hybridTotal, questionType]);

  const LOADING_PHASES = useMemo(() => [
    { text: "Initializing predictive models...", progress: 10 },
    { text: "Analyzing job description & core traits...", progress: 30 },
    { text: "Synthesizing scenario parameters...", progress: 45 },
    { text: "Generating complex cognitive choices...", progress: 65 },
    { text: "Calibrating distractors & difficulty...", progress: 85 },
    { text: "Final polishing... Almost done!", progress: 95 }
  ], []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingPhase(0);
      interval = setInterval(() => {
        setLoadingPhase(prev => (prev < LOADING_PHASES.length - 1 ? prev + 1 : prev));
      }, Math.max(12000, 150000 / LOADING_PHASES.length)); // dynamically pace based on a safe 150s max timeout estimation
    }
    return () => clearInterval(interval);
  }, [isGenerating, LOADING_PHASES.length]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      try {
        const testData = await assessmentApi.getPositionTest(position.id);
        setTest(testData);
      } catch (e: any) {
        if (e.response?.status !== 404 && !e.message?.includes("404")) {
           console.error("Test fetch error:", e);
        }
        setTest(null);
      }
      const cands = await candidatesApi.list(position.id);
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
    const maxRetries = 2;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const payload: any = {
          position_id: position.id,
          time_limit_minutes: timeLimit,
          num_questions: numQuestions,
          question_type: questionType,
        };
        if (questionType === "Hybrid") {
          payload.distribution = hybridDist;
        }
        await assessmentApi.generate(payload);
        toast({ title: "Assessment Generated", description: `${numQuestions} ${questionType} questions created successfully.` });
        setShowConfig(false);
        setIsGenerating(false);
        await loadData();
        return; // Success — exit
      } catch (err: any) {
        lastError = err.message || String(err);
        if (attempt <= maxRetries) {
          console.warn(`[Assessment] Attempt ${attempt} failed, retrying... (${lastError})`);
          toast({ title: `Attempt ${attempt} failed — retrying...`, description: "AI is being slow. Trying again automatically.", variant: "destructive" });
          await new Promise(r => setTimeout(r, 2000 * attempt)); // 2s, 4s backoff
        }
      }
    }

    // All retries exhausted
    toast({ title: "Failed to generate test", description: lastError, variant: "destructive" });
    setIsGenerating(false);
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
    setEditOptions(JSON.parse(JSON.stringify(q.options)));
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
      return !(fitmentReports[c.id] || (c.scores && c.scores.psych > 0));
    });

    if (eligibleCandidates.length === 0) {
      toast({ title: "No Action Needed", description: "All active candidates have already received the test." });
      return;
    }

    setIsDispatchingAll(true);
    let successCount = 0;
    
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

  const updateHybridDist = (key: string, value: number) => {
    setHybridDist(prev => ({ ...prev, [key]: Math.max(0, Math.min(20, value)) }));
  };

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
                <p className="text-xs text-muted-foreground">Pro-configurable psychometric MCQ engine</p>
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
              <p className="text-xs text-muted-foreground max-w-sm mb-6">Create the role-specific test with full control over question types, difficulty distribution, and time limits.</p>
              <Button onClick={() => setShowConfig(true)} className="gradient-primary text-primary-foreground px-8 shadow-lg shadow-indigo-500/20 rounded-full h-10">
                <Sparkles className="h-4 w-4 mr-2" /> Start Generation Setup
              </Button>
            </div>
          )}

          {/* ── PRO GENERATION SETTINGS ─────────────────────────────────────── */}
          {hasJD && !test && showConfig && (
            <div className="p-6 max-w-2xl mx-auto relative">
               {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-full max-w-md relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/10 to-primary/0 animate-shimmer" />
                      <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <h3 className="text-xl font-bold font-display uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-primary">
                            Neural Synthesis Active
                          </h3>
                          <p className="text-[13px] font-medium text-muted-foreground">Constructing AI-driven scenario assessment</p>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                          <div className="w-full h-2.5 rounded-full bg-background border border-border/50 overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 via-primary to-emerald-400 transition-all duration-1000 ease-in-out rounded-full" 
                              style={{ width: `${LOADING_PHASES[loadingPhase]?.progress || 100}%` }}
                            />
                          </div>
                          <p className="text-xs font-mono text-indigo-300/80 animate-pulse">
                            {LOADING_PHASES[loadingPhase]?.text || "Processing..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
               ) : (
                 <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-foreground text-lg font-display">Generation Settings</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Full control over your assessment configuration</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowConfig(false)}><X className="h-4 w-4"/></Button>
                 </div>

                 {/* Row 1: Time + Question Count */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                     <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5 text-orange-400" /> Time Limit (Minutes)
                     </Label>
                     <Input 
                       type="number" min={5} max={60} value={timeLimit} 
                       onChange={e => setTimeLimit(Number(e.target.value))}
                       className="bg-background"
                     />
                   </div>

                   <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                     <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                       <Layers className="w-3.5 h-3.5 text-indigo-400" /> Total Questions
                     </Label>
                     <Input 
                       type="number" min={5} max={25} value={numQuestions} 
                       onChange={e => setNumQuestions(Number(e.target.value))}
                       className="bg-background"
                       disabled={questionType === "Hybrid"}
                     />
                     {questionType === "Hybrid" && (
                       <p className="text-[10px] text-muted-foreground">Auto-calculated from distribution below</p>
                     )}
                   </div>
                 </div>

                 {/* Row 2: Question Type Selection */}
                 <div className="space-y-3">
                   <Label className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                     <BarChart3 className="w-3.5 h-3.5 text-primary" /> Question Type
                   </Label>
                   <div className="grid grid-cols-1 gap-2">
                     {QUESTION_TYPES.map(qt => (
                       <button
                         key={qt.id}
                         onClick={() => setQuestionType(qt.id)}
                         className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${
                           questionType === qt.id
                             ? `${qt.color} border-current shadow-sm`
                             : "border-border/40 bg-background/30 hover:border-border/80 hover:bg-muted/20"
                         }`}
                       >
                         <span className="text-xl flex-shrink-0">{qt.icon}</span>
                         <div className="flex-1 min-w-0">
                           <p className={`text-sm font-semibold ${questionType === qt.id ? "" : "text-foreground"}`}>{qt.label}</p>
                           <p className={`text-[11px] leading-relaxed ${questionType === qt.id ? "opacity-80" : "text-muted-foreground"}`}>{qt.desc}</p>
                         </div>
                         {questionType === qt.id && (
                           <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                         )}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Row 3: Hybrid Distribution (Only when Hybrid selected) */}
                 {questionType === "Hybrid" && (
                   <div className="space-y-3 p-4 rounded-xl border border-pink-500/20 bg-pink-500/5">
                     <div className="flex items-center justify-between">
                       <Label className="text-xs font-bold text-pink-400 flex items-center gap-2 uppercase tracking-wider">
                         <Shuffle className="w-3.5 h-3.5" /> Distribution Control
                       </Label>
                       <Badge variant="outline" className={`text-xs font-mono ${hybridTotal === 0 ? "text-red-400 border-red-500/30" : "text-pink-400 border-pink-500/30"}`}>
                         Total: {hybridTotal} Questions
                       </Badge>
                     </div>
                     <p className="text-[11px] text-muted-foreground">Set how many questions of each type you want in the hybrid mix.</p>
                     
                     <div className="space-y-3 pt-2">
                       {HYBRID_CATEGORIES.map(cat => (
                         <div key={cat.key} className="flex items-center gap-3">
                           <span className="text-base">{cat.emoji}</span>
                           <span className="text-xs font-medium text-foreground w-28 truncate">{cat.label}</span>
                           <div className="flex-1 flex items-center gap-2">
                             <input
                               type="range"
                               min={0}
                               max={15}
                               value={hybridDist[cat.key] || 0}
                               onChange={e => updateHybridDist(cat.key, Number(e.target.value))}
                               className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                               style={{ accentColor: "hsl(var(--primary))" }}
                             />
                             <Input
                               type="number"
                               min={0}
                               max={15}
                               value={hybridDist[cat.key] || 0}
                               onChange={e => updateHybridDist(cat.key, Number(e.target.value))}
                               className="w-16 h-8 text-center text-xs bg-background"
                             />
                           </div>
                         </div>
                       ))}
                     </div>

                     {/* Visual Distribution Bar */}
                     {hybridTotal > 0 && (
                       <div className="flex h-3 rounded-full overflow-hidden mt-3 border border-border/30">
                         {HYBRID_CATEGORIES.map(cat => {
                           const pct = ((hybridDist[cat.key] || 0) / hybridTotal) * 100;
                           if (pct === 0) return null;
                           return (
                             <div
                               key={cat.key}
                               className={`${cat.color} transition-all duration-300`}
                               style={{ width: `${pct}%` }}
                               title={`${cat.label}: ${hybridDist[cat.key]} (${pct.toFixed(0)}%)`}
                             />
                           );
                         })}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Summary + Generate */}
                 <div className="flex flex-col gap-4 pt-2">
                   {/* Summary Badges */}
                   <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
                     <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[11px]">
                       <Clock className="w-3 h-3 mr-1" /> {timeLimit} min
                     </Badge>
                     <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[11px]">
                       <Layers className="w-3 h-3 mr-1" /> {numQuestions} questions
                     </Badge>
                     <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                       {QUESTION_TYPES.find(t => t.id === questionType)?.icon} {questionType}
                     </Badge>
                   </div>

                   <Button 
                     onClick={handleGenerateTest} 
                     disabled={questionType === "Hybrid" && hybridTotal === 0} 
                     className="gradient-primary text-primary-foreground font-semibold w-full h-12 text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                   >
                     <Sparkles className="w-4 h-4 mr-2"/> Generate Test ({numQuestions} Questions)
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
