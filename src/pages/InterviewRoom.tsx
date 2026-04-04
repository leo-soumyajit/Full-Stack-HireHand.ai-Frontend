import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  PhoneOff,
  MessageSquareText,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  Users,
  Volume2,
} from "lucide-react";
import Peer, { MediaConnection } from "peerjs";
import { interviewIntelligenceApi } from "@/lib/interviewIntelligenceApi";
import { useDeepgram } from "@/hooks/useDeepgram";

// ══════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════
interface TranscriptEntry {
  id: number;
  text: string;
  timestamp: string;
  isFinal: boolean;
  speaker?: string;
}

type ConnectionStatus = "connecting" | "waiting" | "connected" | "disconnected" | "failed";



// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = searchParams.get("role") || "host"; // "host" = interviewer, "guest" = candidate
  const scheduleId = searchParams.get("sid") || "";

  // ── State ──────────────────────────────────────────────────────────
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(role === "host"); // Only Host sees transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [preJoin, setPreJoin] = useState(true);
  const [userName, setUserName] = useState(role === "host" ? "Interviewer" : "Candidate");
  const [remoteName, setRemoteName] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptLastFetchRef = useRef<string | null>(null);
  const lastFinalRef = useRef<string>("");

  // ── Speech Recognition ─────────────────────────────────────────────

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      const cleanText = text.trim();
      if (!cleanText || cleanText === lastFinalRef.current) return; // Prevent exact duplicates from engine
      lastFinalRef.current = cleanText;

      const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const entry: TranscriptEntry = { id: Date.now() + Math.random(), text: cleanText, timestamp: ts, isFinal: true, speaker: userName };
      
      setTranscript(prev => [...prev, entry]);
      setInterimText("");
      
      // POST to backend API to share securely
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fetch(`${API_BASE}/api/live-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          speaker: userName,
          text: entry.text,
          timestamp: ts
        })
      }).catch(e => console.warn("Failed to POST transcript to API", e));
      
    } else {
      setInterimText(text);
    }
  }, [userName, roomId]);

  const deepgram = useDeepgram(handleTranscript);

  // ── Poll for remote transcripts ────────────────────────────────────
  useEffect(() => {
    if (connectionStatus !== "connected") return;
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    const interval = window.setInterval(async () => {
       try {
          const params = transcriptLastFetchRef.current ? `?after=${transcriptLastFetchRef.current}` : "";
          const res = await fetch(`${API_BASE}/api/live-transcript/${roomId}${params}`);
          if (res.ok) {
             const data = await res.json();
             if (data.length > 0) {
                transcriptLastFetchRef.current = data[data.length - 1].created_at;
                const otherSpeakerEntries = data
                    .filter((d: any) => d.speaker !== userName)
                    .map((d: any) => ({
                        id: Date.now() + Math.random(),
                        text: d.text,
                        timestamp: d.timestamp,
                        isFinal: true,
                        speaker: d.speaker
                    }));
                
                if (otherSpeakerEntries.length > 0) {
                    setTranscript(prev => {
                        // Deduplicate deeply by text and speaker and timestamp to avoid react strict mode/api glitches
                        const current = [...prev];
                        otherSpeakerEntries.forEach((newE: any) => {
                           const exists = current.some(p => p.text === newE.text && p.speaker === newE.speaker && p.timestamp === newE.timestamp);
                           if (!exists) current.push(newE);
                        });
                        return current;
                    });
                }
             }
          }
       } catch (e) {
          console.warn("Polling error:", e);
       }
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionStatus, roomId, userName]);

  // ── Auto-scroll transcript ─────────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  // ── Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (connectionStatus === "connected" && !preJoin) {
      timerRef.current = window.setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connectionStatus, preJoin]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Initialize Media ───────────────────────────────────────────────
  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Failed to access media devices:", err);
      setConnectionStatus("failed");
      return null;
    }
  };

  // ── Pre-join camera preview ────────────────────────────────────────
  useEffect(() => {
    if (!preJoin) return;
    let stream: MediaStream | null = null;

    // Check speech support on load
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
      stream = s;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = s;
      }
    }).catch(() => {
      console.warn("Camera preview not available");
    });

    return () => {
      // Only stop preview stream if we haven't upgraded it to the main stream
      if (stream && stream !== localStreamRef.current) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [preJoin]);

  const initPeer = async (stream: MediaStream) => {
    // Force a unique guest ID so they don't overlap, but Host MUST be static
    const peerId = role === "host" ? `${roomId}-host` : `${roomId}-guest-${Math.floor(Math.random()*10000)}`;

    // Fetch TURN credentials securely from our backend (API key stays server-side)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/turn-credentials`);
      if (res.ok) {
        const turnServers = await res.json();
        if (Array.isArray(turnServers) && turnServers.length > 0) {
          iceServers = turnServers;
          console.log(`🔒 Got ${turnServers.length} ICE/TURN servers from backend`);
        }
      }
    } catch (e) {
      console.warn("⚠️ Could not fetch TURN credentials, using STUN-only fallback:", e);
    }

    const peer = new Peer(peerId, {
      config: { iceServers },
      debug: 1
    });

    peerRef.current = peer;

    peer.on("open", () => {
      console.log(`✅ Peer connected to signaling server: ${peerId}`);
      if (role === "host") {
        setConnectionStatus("waiting");
      } else {
        // Guest: Call the static host ID immediately
        console.log("Guest: Calling host...");
        setConnectionStatus("connecting");
        const call = peer.call(`${roomId}-host`, stream, { metadata: { name: userName } });
        handleCall(call);
      }
    });

    peer.on("call", (call) => {
      console.log("📞 Host: Incoming call from guest!", call.peer);
      // Host receives call. Give feedback immediately.
      setConnectionStatus("connecting");
      if (call.metadata && call.metadata.name) {
         setRemoteName(call.metadata.name);
      } else {
         setRemoteName("Candidate");
      }
      
      // Answer the call with the local stream
      call.answer(stream);
      handleCall(call);
    });

    peer.on("error", (err: any) => {
      console.error("Peer error:", err);
      if (err.type === "peer-unavailable") {
        // Host isn't there yet.
        setConnectionStatus("waiting");
        
        // ── Auto-retry calling the host if guest joined first ──
        if (role === "guest" && connectionStatus !== "connected") {
          console.log("Host not alive yet... retrying in 3s");
          clearTimeout(reconnectTimerRef.current || 0);
          reconnectTimerRef.current = window.setTimeout(() => {
            if (peerRef.current && !peerRef.current.destroyed && localStreamRef.current) {
              const call = peerRef.current.call(`${roomId}-host`, localStreamRef.current, { metadata: { name: userName } });
              handleCall(call);
            }
          }, 3000);
        }
      } else if (err.type === "network" || err.type === "disconnected") {
          setConnectionStatus("failed");
      }
    });

    peer.on("disconnected", () => {
      setConnectionStatus("disconnected");
      // ── Auto-reconnect logic ──
      console.log("⚡ Peer disconnected. Attempting auto-reconnect...");
      reconnectTimerRef.current = window.setTimeout(() => {
        if (peerRef.current && !peerRef.current.destroyed) {
          try {
            peerRef.current.reconnect();
            console.log("🔄 Reconnect attempted");
          } catch (e) {
            console.error("Reconnect failed:", e);
            setConnectionStatus("failed");
          }
        }
      }, 2000);
    });
  };

  const handleCall = (call: MediaConnection) => {
    callRef.current = call;
    
    // Safety timeout to reset if stream never arrives
    const streamTimeout = setTimeout(() => {
        if (connectionStatus !== "connected") {
            console.log("Stream timeout reached, trying to reset answer.");
        }
    }, 10000);

    call.on("stream", (remoteStream) => {
      console.log("📡 Received remote stream! Tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      clearTimeout(streamTimeout);
      
      // Store stream in ref so useEffect can bind it after React renders the video element
      remoteStreamRef.current = remoteStream;
      setConnectionStatus("connected");
      
      if (role === "guest") {
          setRemoteName("Interviewer");
      }
    });
    
    call.on("close", () => {
      console.log("Call closed by remote peer");
      setConnectionStatus("disconnected");
    });
    
    call.on("error", (err) => {
      console.error("Call error:", err);
      setConnectionStatus("failed");
    });
  };

  // ── Join Room ──────────────────────────────────────────────────────
  const handleJoinRoom = async () => {
    setPreJoin(false);
    const stream = await initMedia();
    if (!stream) return;

    // Start Deepgram live transcription (Nova-2, Indian English)
    deepgram.start(stream);

    await initPeer(stream);
  };

  // ── Bind remote stream to video + audio AFTER React renders ─────────
  useEffect(() => {
    if (connectionStatus === "connected" && remoteStreamRef.current) {
      // Bind video
      if (remoteVideoRef.current) {
        console.log("🎥 Binding remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.play().catch(e => console.error("Video play prevented:", e));
      }
      
      // CRITICAL: Create a separate audio element for reliable audio playback
      // This bypasses browser autoplay restrictions on the video element
      if (!remoteAudioRef.current) {
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioEl.srcObject = remoteStreamRef.current;
        audioEl.volume = 1.0;
        document.body.appendChild(audioEl);
        remoteAudioRef.current = audioEl;
        audioEl.play().then(() => {
          console.log("🔊 Remote audio playing!");
        }).catch(e => console.error("Audio play prevented:", e));
      }
    }
    
    return () => {
      // Cleanup audio element on unmount
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, [connectionStatus]);

  // ── Toggle Controls ────────────────────────────────────────────────
  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMicOn(prev => !prev);
    }
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOn(prev => !prev);
    }
  };

  // ── End Interview ──────────────────────────────────────────────────
  const handleEndInterview = async () => {
    setIsEnding(true);
    deepgram.stop();

    // Build full transcript text with speaker diarization
    const fullTranscript = transcript.map(e => `[${e.timestamp}] ${e.speaker || "Unknown"}: ${e.text}`).join("\n");

    // Cleanup media
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    callRef.current?.close();
    peerRef.current?.destroy();
    if (timerRef.current) clearInterval(timerRef.current);
    // Cleanup audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }

    // Save transcript & trigger AI analysis
    if (role === "host" && scheduleId && fullTranscript.length > 20) {
      try {
        await interviewIntelligenceApi.endInterview(scheduleId, fullTranscript, elapsedSeconds);
      } catch (err) {
        console.error("Failed to save transcript:", err);
      }
    }

    // Redirect back
    setTimeout(() => {
      navigate("/dashboard?s=scheduling&v=scheduling");
    }, 1500);
  };

  // ── Copy invite link ───────────────────────────────────────────────
  const copyInviteLink = () => {
    const base = window.location.origin;
    const link = `${base}/interview/${roomId}?role=guest`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      deepgram.stop();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      callRef.current?.close();
      peerRef.current?.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // PRE-JOIN SCREEN
  // ══════════════════════════════════════════════════════════════════
  if (preJoin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
              <VideoIcon className="h-3 w-3" /> HireHand Interview Room
            </div>
            <h1 className="text-2xl font-bold text-white">Ready to join?</h1>
            <p className="text-white/50 text-sm mt-2">Room: {roomId}</p>
          </div>

          {/* Camera Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10 mb-6">
            <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white/80 text-xs">
              Preview
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500 transition-colors"
              placeholder="Enter your name..."
            />
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinRoom}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <VideoIcon className="h-4 w-4" />
            Join Interview
          </button>

          {!speechSupported && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Speech recognition is not supported in your browser. Use Chrome or Edge for live transcription.</span>
            </div>
          )}

          {role === "host" && (
            <p className="text-white/30 text-xs text-center mt-4">
              🎤 Live transcription will start automatically when you join
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN INTERVIEW ROOM
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#12121a] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <VideoIcon className="h-3 w-3 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">HireHand Interview</span>
          </div>
          <span className="text-white/30 text-xs font-mono">{roomId}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 text-xs ${
            connectionStatus === "connected" ? "text-emerald-400" :
            connectionStatus === "waiting" ? "text-amber-400" :
            connectionStatus === "failed" ? "text-red-400" : "text-white/40"
          }`}>
            {connectionStatus === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connectionStatus === "connected" ? "Connected" :
             connectionStatus === "waiting" ? "Waiting for participant..." :
             connectionStatus === "failed" ? "Connection failed" : "Connecting..."}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-white/60 text-xs font-mono">
            <Clock className="h-3 w-3" />
            {formatTime(elapsedSeconds)}
          </div>

          {/* Recording indicator */}
          {role === "host" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">Transcribing</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col p-4 transition-all ${showTranscript ? "" : ""}`}>
          {/* Remote Video (Main) */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#1a1a2e] border border-white/5">
            {connectionStatus === "connected" ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">
                  {connectionStatus === "waiting" ? "Waiting for participant to join..." : 
                   connectionStatus === "connecting" ? "Connecting..." : 
                   connectionStatus === "failed" ? "Connection failed. Try refreshing." : "Disconnected"}
                </p>
                {connectionStatus === "waiting" && role === "host" && (
                  <button
                    onClick={copyInviteLink}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
                  >
                    {linkCopied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {linkCopied ? "Link copied!" : "Copy invite link"}
                  </button>
                )}
              </div>
            )}

            {remoteName && connectionStatus === "connected" && (
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-xs">
                {remoteName}
              </div>
            )}
          </div>

          {/* Local Video (PiP) */}
          <div className="absolute bottom-24 right-6 w-48 aspect-video rounded-xl overflow-hidden bg-[#1a1a2e] border-2 border-white/10 shadow-2xl z-10">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
                <VideoOff className="h-5 w-5 text-white/30" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white/80 text-[10px]">
              {userName}
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full border-l border-white/5 bg-[#12121a] flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">Live Transcript</span>
                </div>
                <span className="text-[10px] text-white/30 font-mono">{transcript.length} entries</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 && !interimText && (
                  <div className="text-center py-12">
                    <Volume2 className="h-8 w-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-xs">Start speaking to see the transcript...</p>
                  </div>
                )}

                {transcript.map((entry) => (
                  <div key={entry.id} className="group">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] text-white/20 font-mono mt-1 shrink-0">{entry.timestamp}</span>
                      <div>
                        <span className="text-[11px] font-semibold text-indigo-400 block mb-0.5">{entry.speaker || "Unknown"}</span>
                        <p className="text-sm text-white/80 leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Interim (typing) indicator */}
                {interimText && (
                  <div className="flex items-start gap-2 opacity-50">
                    <span className="text-[10px] text-indigo-400 font-mono mt-1 shrink-0">...</span>
                    <p className="text-sm text-white/50 leading-relaxed italic">{interimText}</p>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#12121a] border-t border-white/5">
        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-full transition-all ${
            isMicOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-full transition-all ${
            isCameraOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isCameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        {/* Transcript Toggle */}
        {role === "host" && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-3.5 rounded-full transition-all ${
              showTranscript ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-white/10 hover:bg-white/15 text-white"
            }`}
          >
            <MessageSquareText className="h-5 w-5" />
          </button>
        )}

        {/* End Call */}
        <button
          onClick={() => setShowEndConfirm(true)}
          className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-500/25 ml-4"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      {/* End Interview Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              {isEnding ? (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white">Ending Interview...</h3>
                  <p className="text-sm text-white/50 mt-2">
                    {role === "host" ? "Saving transcript & triggering AI analysis..." : "Leaving the room..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                      <PhoneOff className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">End Interview?</h3>
                    <p className="text-sm text-white/50 mt-2">
                      {role === "host"
                        ? `The transcript (${transcript.length} entries, ${formatTime(elapsedSeconds)}) will be saved and AI analysis will start automatically.`
                        : "You will leave the interview room."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEndConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEndInterview}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
                    >
                      End Interview
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
