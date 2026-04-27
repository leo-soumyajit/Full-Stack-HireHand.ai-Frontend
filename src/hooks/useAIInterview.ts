/**
 * useAIInterview — Custom hook for managing AI Interview WebSocket lifecycle.
 * 
 * 100% NEW FILE — Does NOT modify any existing hook.
 * Reuses useDeepgram for STT but manages its own WebSocket for the AI conversation.
 */

import { useState, useRef, useCallback, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export type AIInterviewState =
  | "lobby"
  | "connecting"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "complete"
  | "error";

export interface TranscriptEntry {
  speaker: "AI" | "You";
  text: string;
  timestamp: string;
}

export interface AIInterviewConfig {
  candidate_name: string;
  position_title: string;
  company_name: string;
  company_logo: string | null;
  time_limit_minutes: number;
  max_questions: number;
  round: number;
  interview_type: string;
  status: string;
  voice: string;
}

export function useAIInterview(token: string) {
  const [state, setState] = useState<AIInterviewState>("lobby");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [config, setConfig] = useState<AIInterviewConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAIText, setCurrentAIText] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // ── Fetch interview config ──
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-interview/${token}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Invalid interview link");
        setState("error");
        return null;
      }
      const data = await res.json();
      setConfig(data);
      setMaxQuestions(data.max_questions || 10);
      return data;
    } catch (e) {
      setError("Failed to load interview details. Please check your connection.");
      setState("error");
      return null;
    }
  }, [token]);

  // ── Audio playback system ──
  const playNextAudioChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const b64 = audioQueueRef.current.shift()!;

      try {
        // Decode base64 to ArrayBuffer
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Create a blob and play it
        const blob = new Blob([bytes], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(); // Don't break the queue on error
          };
          audio.play().catch(() => resolve());
        });
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }

    isPlayingRef.current = false;
  }, []);

  // ── Start the interview ──
  const startInterview = useCallback(() => {
    if (!token) return;

    setState("connecting");

    const ws = new WebSocket(`${WS_BASE}/api/ai-interview/${token}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🤖 AI Interview WebSocket connected");
      setState("greeting");
      // Send ready signal
      ws.send(JSON.stringify({ type: "ready" }));

      // Start timer
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ai_text":
            setCurrentAIText(data.text);
            setTranscript((prev) => [
              ...prev,
              {
                speaker: "AI",
                text: data.text,
                timestamp: new Date().toISOString(),
              },
            ]);
            break;

          case "ai_audio":
            // Queue audio for playback
            audioQueueRef.current.push(data.data);
            playNextAudioChunk();
            break;

          case "state":
            if (data.state === "speaking") {
              setState("speaking");
            } else if (data.state === "listening") {
              setState("listening");
            } else if (data.state === "thinking") {
              setState("thinking");
            }
            break;

          case "progress":
            setQuestionCount(data.current);
            if (data.total) setMaxQuestions(data.total);
            break;

          case "interview_complete":
            setState("complete");
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            break;

          case "error":
            console.error("AI Interview error:", data.message);
            setError(data.message);
            setState("error");
            break;
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    ws.onclose = (event) => {
      console.log(`🔌 AI Interview WebSocket closed (code: ${event.code})`);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // If not already complete, mark as error
      setState((prev) => (prev === "complete" ? prev : "error"));
    };

    ws.onerror = (err) => {
      console.error("AI Interview WebSocket error:", err);
      setError("Connection error. Please check your internet connection.");
      setState("error");
    };
  }, [token, playNextAudioChunk]);

  // ── Send candidate speech to backend ──
  const sendCandidateSpeech = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setTranscript((prev) => [
      ...prev,
      {
        speaker: "You",
        text,
        timestamp: new Date().toISOString(),
      },
    ]);

    wsRef.current.send(
      JSON.stringify({ type: "candidate_speech", text })
    );
  }, []);

  // ── Send interim speech (for UI display only) ──
  const sendInterimSpeech = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ type: "speech_interim", text })
    );
  }, []);

  // ── Report tab switch ──
  const reportTabSwitch = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "tab_switch" }));
  }, []);

  // ── End interview early ──
  const endInterview = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "end" }));
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    state,
    transcript,
    questionCount,
    maxQuestions,
    elapsedSeconds,
    config,
    error,
    currentAIText,
    fetchConfig,
    startInterview,
    sendCandidateSpeech,
    sendInterimSpeech,
    reportTabSwitch,
    endInterview,
  };
}
