import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CandidateAssessment from "./pages/CandidateAssessment";
import InterviewRoom from "./pages/InterviewRoom";
import AIInterviewRoom from "./pages/AIInterviewRoom";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SeekerProtectedRoute } from "@/components/SeekerProtectedRoute";
import JobBoard from "./pages/seeker/JobBoard";
import JobDetail from "./pages/seeker/JobDetail";
import SeekerLogin from "./pages/seeker/SeekerLogin";
import SeekerSignup from "./pages/seeker/SeekerSignup";
import SeekerResetPassword from "./pages/seeker/SeekerResetPassword";
import Onboarding from "./pages/seeker/Onboarding";
import SeekerDashboard from "./pages/seeker/SeekerDashboard";
import "@/styles/ai-interview.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="interview-ai-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SmoothScroll>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ── Job Seeker Portal ── */}
              <Route path="/jobs" element={<JobBoard />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/seeker/login" element={<SeekerLogin />} />
              <Route path="/seeker/signup" element={<SeekerSignup />} />
              <Route path="/seeker/reset-password" element={<SeekerResetPassword />} />
              <Route path="/seeker/onboarding" element={<SeekerProtectedRoute><Onboarding /></SeekerProtectedRoute>} />
              <Route path="/seeker/dashboard" element={<SeekerProtectedRoute><SeekerDashboard /></SeekerProtectedRoute>} />

              <Route path="/assessment/:token" element={<CandidateAssessment />} />
              <Route path="/interview/:roomId" element={<InterviewRoom />} />
              <Route path="/ai-interview/:token" element={<AIInterviewRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SmoothScroll>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
