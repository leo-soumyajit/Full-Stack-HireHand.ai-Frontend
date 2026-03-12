import { useState } from "react";
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
  const [view, setView] = useState<DashboardView>("home");
  const [activeSection, setActiveSection] = useState("home");
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleViewPosition = (id: string) => {
    setSelectedPositionId(id);
    setView("position-detail");
    setActiveSection("positions");
  };

  const handleBackToHome = () => {
    // Go back to whichever section was active before drilling into a position
    if (activeSection === "candidates") {
      setView("candidates");
    } else {
      setView(activeSection === "positions" ? "positions" : "home");
    }
    setSelectedPositionId(null);
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
    setActiveSection(section);
    setSelectedPositionId(null);

    if (section === "home") {
      setView("home");
    } else if (section === "positions") {
      setView("positions");
    } else if (section === "candidates") {
      setView("candidates");
    } else if (section === "scheduling") {
      setView("scheduling");
    }
    // Other sections (analytics, etc.) — stay on current view for now
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
              <AllCandidatesView key="candidates" />
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
