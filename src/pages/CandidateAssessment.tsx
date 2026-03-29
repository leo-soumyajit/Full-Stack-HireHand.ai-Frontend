import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Clock, Loader2, Disc3, ShieldAlert, CheckCircle2, FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLoader } from "@/components/ui/main-loader";
import { assessmentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  trait_assessed: string;
  scenario: string;
  options: { id: string; text: string }[];
}

interface TestData {
  candidate_name: string;
  role_title: string;
  company_name: string;
  time_limit_minutes: number;
  questions: Question[];
}

interface QuestionResponse {
  question_id: string;
  selected_option_id: string;
  time_spent_ms: number;
}

export default function CandidateAssessment() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestData | null>(null);
  
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timers & Behavioral Tracking
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const globalStartRef = useRef<number>(0);

  // Fetch test data on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid assessment link.");
      setIsLoading(false);
      return;
    }

    const loadTest = async () => {
      try {
        const data = await assessmentApi.getTest(token);
        setTestData(data);
        setTimeLeft(data.time_limit_minutes * 60);
      } catch (err: any) {
        setError(err.message || "Link has expired or is invalid.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [token]);

  // Global Countdown Timer
  useEffect(() => {
    if (!started || isCompleted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [started, isCompleted, timeLeft]);

  const handleStart = () => {
    setStarted(true);
    globalStartRef.current = Date.now();
    setQuestionStartTime(Date.now());
  };

  const handleNext = () => {
    if (!selectedOption || !testData) return;

    const timeSpent = Date.now() - questionStartTime;
    const currentQ = testData.questions[currentQIndex];

    const newResponse: QuestionResponse = {
      question_id: currentQ.id,
      selected_option_id: selectedOption,
      time_spent_ms: timeSpent
    };

    setResponses(prev => [...prev, newResponse]);
    setTotalTimeSpent(prev => prev + timeSpent);
    setSelectedOption(null);

    if (currentQIndex < testData.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // It was the last question
      void handleSubmit([...responses, newResponse], totalTimeSpent + timeSpent);
    }
  };

  const handleAutoSubmit = () => {
    toast({ title: "Time's Up!", description: "Submitting your assessment...", variant: "destructive" });
    // If they were lingering on a question, we don't count it as a clean answer
    void handleSubmit(responses, Date.now() - globalStartRef.current);
  };

  const handleSubmit = async (finalResponses: QuestionResponse[], totalMs: number) => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await assessmentApi.submit(token, {
        responses: finalResponses,
        total_time_spent_ms: totalMs
      });
      setIsCompleted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message || "Please contact HR.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><MainLoader text="Verifying Magic Link..." /></div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full glass-card border-red-500/20 glow-sm glow-red-500/10">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md w-full glass-card border-emerald-500/20 glow-md glow-emerald-500/20">
            <CardContent className="p-10 text-center space-y-6">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold font-display text-foreground mb-2">Assessment Complete</h2>
                <p className="text-sm text-muted-foreground">
                  Thank you, {testData?.candidate_name}. Your responses have been securely submitted to {testData?.company_name} for the {testData?.role_title} role.
                </p>
              </div>
              <p className="text-xs font-medium text-emerald-500/80">You may now close this window.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!testData) return null;

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-32 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <Card className="max-w-xl w-full glass-card glow-lg relative z-10">
          <CardContent className="p-8 sm:p-12 text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center mb-6">
                <BrainCircuit className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold tracking-widest text-indigo-400 uppercase">EOS-IA Assessment</p>
              <h1 className="text-3xl sm:text-4xl font-bold font-display leading-tight text-foreground">
                Welcome, {testData.candidate_name}
              </h1>
              <p className="text-base text-muted-foreground w-11/12 mx-auto">
                You've been invited by <span className="text-foreground font-semibold">{testData.company_name}</span> to complete a role-scenario assessment for the <span className="text-foreground font-semibold">{testData.role_title}</span> position.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/40 space-y-2">
                <FileQuestion className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold text-foreground text-sm">Scenarios</h3>
                <p className="text-xs text-muted-foreground">{testData.questions.length} behavioral questions based on real role challenges.</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 border border-border/40 space-y-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <h3 className="font-semibold text-foreground text-sm">Time Limit</h3>
                <p className="text-xs text-muted-foreground">Strict {testData.time_limit_minutes}-minute timer. It will auto-submit when time is up.</p>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleStart} size="lg" className="w-full h-14 text-lg font-semibold gradient-primary rounded-xl shadow-lg shadow-indigo-500/25">
                Begin Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = testData.questions[currentQIndex];
  const progress = ((currentQIndex) / testData.questions.length) * 100;
  const isTimeCritical = timeLeft < 60; // less than 1 min red

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header & Progress */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 p-4">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-9 w-9 rounded-lg bg-indigo-500/15 items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{testData.role_title}</p>
              <p className="text-sm font-bold text-foreground">Question {currentQIndex + 1} of {testData.questions.length}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm font-mono text-lg font-bold transition-colors ${isTimeCritical ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-muted/50 border-border text-foreground'}`}>
            <Clock className={`h-4 w-4 ${isTimeCritical ? 'text-red-500' : 'text-orange-400'}`} />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-muted">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: `${((currentQIndex - 1) / testData.questions.length) * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 space-y-10 py-6"
          >
            <div className="space-y-4">
              <BadgeBox>Scenario</BadgeBox>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">
                {currentQ.scenario}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === opt.id;
                const badges = ["A", "B", "C", "D"];
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`group relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 overflow-hidden flex gap-4 ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/5 glow-sm glow-indigo-500/10' 
                        : 'bg-card border-border/50 hover:bg-muted/60 hover:border-border'
                    }`}
                  >
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20 group-hover:text-foreground'
                    }`}>
                      {badges[i]}
                    </div>
                    <span className={`text-sm sm:text-base font-medium leading-relaxed ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        <div className="pt-8 border-t border-border/40 flex justify-end">
          <Button 
            disabled={!selectedOption || isSubmitting}
            onClick={handleNext}
            size="lg"
            className="min-w-[140px] font-semibold gradient-primary px-8"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentQIndex === testData.questions.length - 1 ? (
              "Submit Assessment"
            ) : (
              "Next Scenario"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

function BadgeBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
      {children}
    </div>
  )
}
