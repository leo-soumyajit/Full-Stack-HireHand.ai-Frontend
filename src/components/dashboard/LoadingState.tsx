import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass">
          <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-foreground font-medium">AI is analyzing your job description...</span>
        </div>
      </div>

      {[1, 2, 3].map((group) => (
        <div key={group} className="glass-strong rounded-2xl p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (group - 1) * 0.2 + item * 0.1 }}
              >
                <Skeleton className="h-16 w-full rounded-xl" />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
