import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { PositionDetail } from "@/components/dashboard/PositionDetail";
import { AllCandidatesView } from "@/components/dashboard/AllCandidatesView";
import { JDInput } from "@/components/dashboard/JDInput";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { QuestionList } from "@/components/dashboard/QuestionList";
import { SchedulingTab } from "@/components/dashboard/SchedulingTab"; // Added import
import { Question } from "@/types/questions";
import { generateQuestionsFromJD } from "@/lib/openrouter";
import { useToast } from "@/hooks/use-toast";

// Extended view type that covers all sidebar sections
type DashboardView =
  | "home"
  | "positions"        // sidebar → Positions tab (same as home but filtered)
  | "candidates"       // sidebar → All Candidates view
  | "position-detail"
  | "input"
  | "loading"
  | "results"
  | "scheduling";

const Dashboard = () => {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const view = (searchParams.get("v") as DashboardView) || "home";
  const activeSection = searchParams.get("s") || "home";
  const selectedPositionId = searchParams.get("p") || null;

  const setView = (newView: DashboardView) => setSearchParams(prev => { prev.set("v", newView); return prev; }, { replace: true });
  const setActiveSection = (newSection: string) => setSearchParams(prev => { prev.set("s", newSection); return prev; }, { replace: true });
  const setSelectedPositionId = (newId: string | null) => setSearchParams(prev => { if (newId) prev.set("p", newId); else prev.delete("p"); return prev; }, { replace: true });

  const [questions, setQuestions] = useState<Question[]>([]);

  const handleViewPosition = (id: string) => {
    setSearchParams(prev => {
      prev.set("p", id);
      prev.set("v", "position-detail");
      prev.set("s", "positions");
      return prev;
    });
  };

  const handleViewCandidate = (positionId: string, candidateId: string) => {
    setSearchParams(prev => {
      prev.set("p", positionId);
      prev.set("v", "position-detail");
      prev.set("s", "positions");
      prev.set("t", "candidates");
      prev.set("c", candidateId);
      return prev;
    });
  };

  const handleBackToHome = () => {
    setSearchParams(prev => {
      if (activeSection === "candidates") {
        prev.set("v", "candidates");
      } else {
        prev.set("v", activeSection === "positions" ? "positions" : "home");
      }
      prev.delete("p");
      prev.delete("t"); // clear position tab
      prev.delete("c"); // clear viewing candidate id
      return prev;
    });
  };

  const handleGenerate = async (jd: string) => {
    if (!jd.trim()) {
      toast({ title: "Error", description: "Job description cannot be empty", variant: "destructive" });
      return;
    }
    setView("loading");
    try {
      const generatedQuestions = await generateQuestionsFromJD(jd);
      setQuestions(generatedQuestions);
      setView("results");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
      setView("input");
    }
  };

  const handlePasteJD = () => setView("input");

  const handleSectionChange = (section: string) => {
    setSearchParams(prev => {
      prev.set("s", section);
      prev.delete("p");
      prev.delete("t");
      prev.delete("c");

      if (section === "home") prev.set("v", "home");
      else if (section === "positions") prev.set("v", "positions");
      else if (section === "candidates") prev.set("v", "candidates");
      else if (section === "scheduling") prev.set("v", "scheduling");
      
      return prev;
    });
  };

  // Positions view is identical to home (DashboardHome already has tabs for Open/Closed)
  const showHome = view === "home" || view === "positions";

  return (
    <div className="flex min-h-screen w-full bg-background bg-dot-grid">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onPasteJD={handlePasteJD}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {showHome && (
              <DashboardHome key="home" onViewPosition={handleViewPosition} />
            )}
            {view === "candidates" && (
              <AllCandidatesView key="candidates" onViewCandidate={handleViewCandidate} />
            )}
            {view === "position-detail" && selectedPositionId && (
              <PositionDetail
                key="detail"
                positionId={selectedPositionId}
                onBack={handleBackToHome}
              />
            )}
            {view === "scheduling" && (
              <SchedulingTab key="scheduling" />
            )}
            {view === "input" && (
              <JDInput key="input" onGenerate={handleGenerate} isGenerating={false} />
            )}
            {view === "loading" && <LoadingState key="loading" />}
            {view === "results" && (
              <QuestionList
                key="results"
                questions={questions}
                onUpdateQuestions={setQuestions}
                onBack={handleBackToHome}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
