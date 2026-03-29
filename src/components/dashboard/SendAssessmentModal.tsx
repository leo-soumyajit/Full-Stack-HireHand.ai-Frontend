import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, BrainCircuit, Clock, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { assessmentApi } from "@/lib/api";

interface SendAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  candidateId: string | null;
  candidateName: string;
  positionId: string;
}

export function SendAssessmentModal({ open, onClose, candidateId, candidateName, positionId }: SendAssessmentModalProps) {
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!candidateId) return;
    setIsSending(true);
    try {
      const res = await assessmentApi.send({
        position_id: positionId,
        candidate_id: candidateId,
        time_limit_minutes: timeLimit,
        num_questions: numQuestions,
      });
      toast({ title: "Assessment Sent", description: "The magic link has been emailed to the candidate." });
      onClose();
    } catch (err: any) {
      toast({
        title: "Failed to send assessment",
        description: err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={isSending ? undefined : onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-card border border-border/40 rounded-2xl shadow-2xl glow-md glow-indigo-500/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <BrainCircuit className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display">Send Psychometric Test</h3>
                  <p className="text-xs text-muted-foreground">To {candidateName}</p>
                </div>
              </div>
              <Button disabled={isSending} variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-primary" /> Number of Scenarios
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={5}
                    max={20}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="bg-background/50 border-border/50 focus:border-indigo-500 w-24 text-center text-lg font-mono font-medium"
                  />
                  <span className="text-xs text-muted-foreground w-full">
                    The AI will generate highly contextual MCQs. More questions = deeper analysis. (Default 10)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" /> Time Limit (Minutes)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="bg-background/50 border-border/50 focus:border-indigo-500 w-24 text-center text-lg font-mono font-medium"
                  />
                  <span className="text-xs text-muted-foreground w-full">
                    Strict timer. Used for behavioral analysis (hesitation tracking vs impulsive choices).
                  </span>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> What happens next?
                </h4>
                <ul className="space-y-1.5 list-none m-0 p-0 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>A unique dummy credential link will be emailed to the candidate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>They log in and face scenario-based questions generated specifically for this JD.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>The system tracks time-per-question to build a deep behavioral Fitment Report.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30 bg-muted/10">
              <Button disabled={isSending} variant="ghost" onClick={onClose} className="font-semibold">Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="bg-indigo-500 text-white hover:bg-indigo-600 font-semibold rounded-lg shadow-lg shadow-indigo-500/20"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                {isSending ? "Generating & Sending..." : "Send Assessment Link"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
