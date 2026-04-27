/**
 * AIInterviewRoom — Autonomous AI Interview Page
 * 
 * 100% NEW FILE — Does NOT modify any existing page.
 * A premium, immersive interview experience where AI conducts
 * the interview via voice, with live transcript and progress tracking.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Clock,
  Bot,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Sparkles,
  Volume2,
  Shield,
} from "lucide-react";
import { useAIInterview } from "@/hooks/useAIInterview";
import { useDeepgram } from "@/hooks/useDeepgram";

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ══════════════════════════════════════════════════════════════════════
// AI ORB / AVATAR ANIMATION COMPONENT
// ══════════════════════════════════════════════════════════════════════
function AIOrb({ state, voice = "asteria" }: { state: string; voice?: string }) {
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";
  const isListening = state === "listening";

  const isMale = voice.includes("orion") || voice.includes("arcas");
  const avatarSrc = isMale ? "/avatars/male-avatar.png" : "/avatars/female-avatar.png";

  return (
    <div className="ai-orb-container">
      {/* Outer glow rings */}
      <motion.div
        className="ai-orb-ring ai-orb-ring-outer"
        animate={{
          scale: isSpeaking ? [1, 1.3, 1] : isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: isSpeaking ? 0.8 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="ai-orb-ring ai-orb-ring-middle"
        animate={{
          scale: isSpeaking ? [1, 1.2, 1] : isThinking ? [1, 1.1, 1] : [1, 1.03, 1],
          opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: isSpeaking ? 0.6 : 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.15,
        }}
      />

      {/* Core orb */}
      <motion.div
        className="ai-orb-core"
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : isThinking ? [1, 1.04, 1] : 1,
          boxShadow: isSpeaking
            ? [
                "0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(139,92,246,0.2)",
                "0 0 60px rgba(99,102,241,0.6), 0 0 120px rgba(139,92,246,0.3)",
                "0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(139,92,246,0.2)",
              ]
            : "0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(139,92,246,0.15)",
        }}
        transition={{
          duration: isSpeaking ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-indigo-500/50 bg-black">
          <img src={avatarSrc} alt="AI Interviewer" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {/* Status label */}
      <motion.div
        className="ai-orb-status"
        key={state}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isSpeaking && (
          <span className="ai-status-speaking">
            <Volume2 className="w-4 h-4 animate-pulse" />
            AI is speaking...
          </span>
        )}
        {isThinking && (
          <span className="ai-status-thinking">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is thinking...
          </span>
        )}
        {isListening && (
          <span className="ai-status-listening">
            <Mic className="w-4 h-4 animate-pulse" />
            Listening to you...
          </span>
        )}
        {state === "greeting" && (
          <span className="ai-status-thinking">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Preparing your interview...
          </span>
        )}
        {state === "connecting" && (
          <span className="ai-status-thinking">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </span>
        )}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function AIInterviewRoom() {
  const { token } = useParams<{ token: string }>();
  const {
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
  } = useAIInterview(token || "");

  // ── Local state ──
  const [preJoin, setPreJoin] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [interimText, setInterimText] = useState("");

  // ── Refs ──
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastFinalRef = useRef<string>("");

  // ── Deepgram STT (reusing existing hook) ──
  // Buffer final transcripts and wait for silence before sending full answer
  const speechBufferRef = useRef<string[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const SILENCE_DELAY_MS = 4000; // Wait 4.0s of silence before sending answer

  const flushSpeechBuffer = useCallback(() => {
    const fullAnswer = speechBufferRef.current.join(" ").trim();
    if (fullAnswer.length > 0) {
      sendCandidateSpeech(fullAnswer);
    }
    speechBufferRef.current = [];
  }, [sendCandidateSpeech]);

  const onTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      // 1. Handle the text
      if (isFinal && text.trim()) {
        // Deduplicate exactly identical consecutive final texts (rare but possible)
        if (text.trim() === lastFinalRef.current) return;
        lastFinalRef.current = text.trim();

        // Add to buffer
        speechBufferRef.current.push(text.trim());
        setInterimText("");
      } else if (text.trim()) {
        // Show interim text (what candidate is currently saying)
        const bufferedSoFar = speechBufferRef.current.join(" ");
        setInterimText(bufferedSoFar ? `${bufferedSoFar} ${text}` : text);
        sendInterimSpeech(text);
      }

      // 2. Restart the silence timer on ANY speech (final or interim)
      if (text.trim()) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          flushSpeechBuffer();
          silenceTimerRef.current = null;
        }, SILENCE_DELAY_MS);
      }
    },
    [sendCandidateSpeech, sendInterimSpeech, flushSpeechBuffer]
  );

  const deepgram = useDeepgram(onTranscript);

  // ── Load config on mount ──
  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token, fetchConfig]);

  // ── Tab switch detection ──
  useEffect(() => {
    if (state === "lobby" || state === "complete" || state === "error") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportTabSwitch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state, reportTabSwitch]);

  // ── Auto-scroll transcript ──
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  // ── Initialize camera/mic for pre-join ──
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMicTested(true);
    } catch (e) {
      console.error("Media access failed:", e);
      // Try audio-only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setMicTested(true);
        setIsCameraOn(false);
      } catch (e2) {
        console.error("Audio access also failed:", e2);
      }
    }
  }, []);

  useEffect(() => {
    if (preJoin) {
      initMedia();
    }
  }, [preJoin, initMedia]);

  // ── Start the interview ──
  const handleStart = useCallback(() => {
    setPreJoin(false);
    startInterview();

    // Start Deepgram STT
    if (localStreamRef.current) {
      deepgram.start(localStreamRef.current);
    }
  }, [startInterview, deepgram]);

  // ── Toggle mic ──
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  // ── Toggle camera ──
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  // ── End interview ──
  const handleEndInterview = useCallback(() => {
    // Flush any remaining speech in the buffer before ending
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    flushSpeechBuffer();
    deepgram.stop();
    endInterview();
    setShowEndConfirm(false);
  }, [deepgram, endInterview, flushSpeechBuffer]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      deepgram.stop();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // RENDER: ERROR STATE
  // ══════════════════════════════════════════════════════════════════
  if (state === "error" || error) {
    return (
      <div className="ai-interview-page">
        <div className="ai-error-container">
          <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Interview Error</h2>
          <p className="text-white/60 text-center max-w-md">{error || "Something went wrong. Please try again."}</p>
          <a href="/" className="ai-btn-secondary mt-6">Return Home</a>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: INTERVIEW COMPLETE
  // ══════════════════════════════════════════════════════════════════
  if (state === "complete") {
    return (
      <div className="ai-interview-page">
        <motion.div
          className="ai-complete-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-20 h-20 text-green-400 mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Interview Complete! 🎉</h2>
          <p className="text-white/60 text-center max-w-md mb-2">
            Your responses have been recorded and are being evaluated by our AI assessment engine.
          </p>
          <p className="text-white/40 text-sm mb-6">
            Duration: {formatTime(elapsedSeconds)} • Questions: {questionCount}
          </p>
          {config?.company_name && (
            <p className="text-white/50 text-sm">
              You'll hear back from <span className="text-indigo-400 font-medium">{config.company_name}</span> soon.
            </p>
          )}
          <div className="ai-complete-badge">
            <Shield className="w-4 h-4" />
            Powered by HireHand AI
          </div>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: PRE-JOIN LOBBY
  // ══════════════════════════════════════════════════════════════════
  if (preJoin) {
    return (
      <div className="ai-interview-page">
        <div className="ai-lobby-container">
          {/* Header */}
          <div className="ai-lobby-header">
            <div className="ai-lobby-badge">
              <Bot className="w-5 h-5" />
              AI Interview
            </div>
            {config && (
              <>
                <h1 className="ai-lobby-title">{config.position_title}</h1>
                {config.company_name && (
                  <p className="ai-lobby-company">{config.company_name}</p>
                )}
                <div className="ai-lobby-meta">
                  <span><Clock className="w-4 h-4" /> ~{config.time_limit_minutes} min</span>
                  <span><Bot className="w-4 h-4" /> Round {config.round}</span>
                </div>
              </>
            )}
          </div>

          {/* Video preview */}
          <div className="ai-lobby-preview">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="ai-lobby-video"
            />
            {!isCameraOn && (
              <div className="ai-lobby-video-off">
                <VideoOff className="w-8 h-8 text-white/40" />
                <span className="text-white/40 text-sm">Camera off</span>
              </div>
            )}
          </div>

          {/* Mic test */}
          <div className="ai-lobby-mic-test">
            <div className={`ai-mic-indicator ${micTested ? "ai-mic-ready" : ""}`}>
              {micTested ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Microphone ready</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                  <span className="text-white/40">Checking microphone...</span>
                </>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="ai-lobby-tips">
            <p className="ai-lobby-tips-title">💡 Tips for your AI interview</p>
            <ul>
              <li>Speak clearly and naturally — the AI understands conversational speech</li>
              <li>Take your time to think before answering</li>
              <li>Give specific examples from your experience</li>
              <li>Keep your camera on for the best experience</li>
            </ul>
          </div>

          {/* Start button */}
          <button
            className="ai-btn-primary"
            onClick={handleStart}
            disabled={!micTested || !config}
          >
            {!config ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start Interview
              </>
            )}
          </button>

          <p className="ai-lobby-footer">⚡ Powered by HireHand AI</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: ACTIVE INTERVIEW
  // ══════════════════════════════════════════════════════════════════
  const progressPercent = maxQuestions > 0 ? (questionCount / maxQuestions) * 100 : 0;

  return (
    <div className="ai-interview-page">
      <div className="ai-interview-layout">
        {/* ── Top Bar ── */}
        <div className="ai-topbar">
          <div className="ai-topbar-left">
            <div className="ai-topbar-badge">
              <Bot className="w-4 h-4" />
              HireHand AI
            </div>
            {config && (
              <span className="ai-topbar-position">{config.position_title}</span>
            )}
          </div>
          <div className="ai-topbar-right">
            <div className="ai-topbar-timer">
              <Clock className="w-4 h-4" />
              {formatTime(elapsedSeconds)}
            </div>
            <div className="ai-topbar-progress">
              Q{questionCount}/{maxQuestions}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="ai-main-content">
          {/* Left: AI Avatar */}
          <div className="ai-orb-section">
            <AIOrb state={state} voice={config?.voice} />
          </div>

          {/* Right: Transcript + Video */}
          <div className="ai-side-section">
            {/* Self-view video */}
            <div className="ai-self-video-wrapper">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="ai-self-video"
              />
              {!isCameraOn && (
                <div className="ai-self-video-off">
                  <VideoOff className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="ai-transcript-panel">
              <div className="ai-transcript-header">
                <span>Live Transcript</span>
              </div>
              <div className="ai-transcript-body">
                {transcript.length === 0 && (
                  <div className="ai-transcript-empty">
                    <Sparkles className="w-5 h-5 text-indigo-400/50" />
                    <span>Interview will appear here...</span>
                  </div>
                )}
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`ai-transcript-entry ${
                      entry.speaker === "AI" ? "ai-transcript-ai" : "ai-transcript-you"
                    }`}
                  >
                    <span className="ai-transcript-speaker">
                      {entry.speaker === "AI" ? "🤖 AI" : "👤 You"}
                    </span>
                    <p className="ai-transcript-text">{entry.text}</p>
                  </div>
                ))}
                {interimText && (
                  <div className="ai-transcript-entry ai-transcript-you ai-transcript-interim">
                    <span className="ai-transcript-speaker">👤 You</span>
                    <p className="ai-transcript-text">{interimText}...</p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="ai-progress-bar-wrapper">
          <div className="ai-progress-bar">
            <motion.div
              className="ai-progress-fill"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ── Bottom Controls ── */}
        <div className="ai-controls">
          <button
            className={`ai-control-btn ${isMicOn ? "" : "ai-control-off"}`}
            onClick={toggleMic}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            className={`ai-control-btn ${isCameraOn ? "" : "ai-control-off"}`}
            onClick={toggleCamera}
          >
            {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            className="ai-control-btn ai-control-end"
            onClick={() => setShowEndConfirm(true)}
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── End Confirm Modal ── */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="ai-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ai-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">End Interview?</h3>
              <p className="text-white/60 text-sm text-center mb-5">
                Are you sure you want to end the interview early? Your responses so far will still be evaluated.
              </p>
              <div className="ai-modal-buttons">
                <button className="ai-btn-secondary" onClick={() => setShowEndConfirm(false)}>
                  Continue Interview
                </button>
                <button className="ai-btn-danger" onClick={handleEndInterview}>
                  End Interview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
