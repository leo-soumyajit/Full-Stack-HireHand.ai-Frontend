import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface JDInputProps {
  onGenerate: (jd: string) => void;
  isGenerating: boolean;
}

export function JDInput({ onGenerate, isGenerating }: JDInputProps) {
  const [jobDescription, setJobDescription] = useState("");

  const handleGenerate = () => {
    if (jobDescription.trim()) {
      onGenerate(jobDescription);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="glass-strong rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Paste Job Description</h2>
            <p className="text-muted-foreground">Our AI will analyze and generate tailored questions</p>
          </div>
        </div>

        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste your job description here...

Example:
We are looking for a Senior Software Engineer with 5+ years of experience in React, TypeScript, and Node.js. The ideal candidate will have strong problem-solving skills, experience with agile methodologies, and excellent communication abilities..."
          className="min-h-[300px] bg-background/50 border-border/50 focus:border-primary text-foreground resize-none"
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={!jobDescription.trim() || isGenerating}
            className="h-12 px-8 rounded-full gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </motion.div>
              ) : (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Questions
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
