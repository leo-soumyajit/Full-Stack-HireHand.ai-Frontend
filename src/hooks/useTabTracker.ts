import { useState, useEffect, useCallback } from "react";
import type { DataConnection } from "peerjs";
import { playWarningNotification } from "@/utils/warningNotification";
import { toast } from "sonner";

/**
 * useTabTracker — Isolated tab tracking hook to detect candidate cheating.
 * 
 * IF GUEST (Candidate): Listens to window visibility change and blur events.
 * Upon blur/hidden, it increments local storage counter and notifies host via P2P.
 * 
 * IF HOST (Interviewer): Listens to data messages. If "tab-switch" event arrives,
 * shows a live toast and plays warning sound.
 */
export function useTabTracker(role: string, dataConnRef: React.RefObject<DataConnection | null>) {
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);

  // Load initial count from session storage to survive transient refreshes
  useEffect(() => {
    if (role === "guest") {
      const stored = sessionStorage.getItem("hirehand_tab_switches");
      if (stored) {
        setTabSwitchCount(parseInt(stored, 10));
      }
    }
  }, [role]);

  // Handle detection on Guest side
  const handleVisibilityChange = useCallback(() => {
    if (role !== "guest") return;
    
    // We only care when the document becomes hidden
    if (document.hidden) {
      setTabSwitchCount((prev) => {
        const newCount = prev + 1;
        sessionStorage.setItem("hirehand_tab_switches", newCount.toString());
        
        // Notify host via P2P data connection
        if (dataConnRef.current && dataConnRef.current.open) {
          dataConnRef.current.send({
            type: "tab-switch",
            count: newCount
          });
        }
        return newCount;
      });
    }
  }, [role, dataConnRef]);

  useEffect(() => {
    if (role === "guest") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleVisibilityChange);
      
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleVisibilityChange);
      };
    }
  }, [role, handleVisibilityChange]);

  // Host receiver logic
  const handleIncomingTabSwitchMessage = useCallback((payload: any) => {
    if (role === "host" && payload && payload.type === "tab-switch") {
      setTabSwitchCount(payload.count);
      // Play harsh sound
      playWarningNotification();
      // Show massive toast on host side
      toast.error(`WARNING: Candidate switched tabs! (Count: ${payload.count})`, {
        duration: 5000,
        position: "top-center",
        style: {
          background: "#7f1d1d", // red-900 equivalent
          color: "#fff",
          fontWeight: "bold",
          border: "1px solid #ef4444",
        },
      });
    }
  }, [role]);

  return {
    tabSwitchCount,
    handleIncomingTabSwitchMessage // To be called from inside InterviewRoom data listener
  };
}
