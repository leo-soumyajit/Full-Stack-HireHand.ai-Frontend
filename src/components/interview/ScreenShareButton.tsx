/**
 * ScreenShareButton — Isolated, production-grade screen sharing component.
 *
 * Google Meet–style screen sharing with tab audio support.
 * Uses RTCRtpSender.replaceTrack() to swap camera↔screen WITHOUT
 * creating a new PeerJS call. Zero impact on existing features.
 *
 * Works for both Host and Guest.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Monitor, MonitorOff } from "lucide-react";
import type { MediaConnection } from "peerjs";

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────
interface ScreenShareButtonProps {
  /** Ref to the active PeerJS MediaConnection (call) */
  peerCallRef: React.RefObject<MediaConnection | null>;
  /** Ref to the user's local camera+mic MediaStream */
  localStreamRef: React.RefObject<MediaStream | null>;
  /** Ref to the local <video> element (PiP) */
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the call is currently connected */
  isConnected: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────
export function ScreenShareButton({
  peerCallRef,
  localStreamRef,
  localVideoRef,
  isConnected,
}: ScreenShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // ── Get the video RTCRtpSender from the active PeerJS call ────────
  const getVideoSender = useCallback((): RTCRtpSender | null => {
    const call = peerCallRef.current;
    if (!call) return null;

    // PeerJS exposes the underlying RTCPeerConnection
    const pc = (call as any).peerConnection as RTCPeerConnection | undefined;
    if (!pc) return null;

    const senders = pc.getSenders();
    return senders.find((s) => s.track?.kind === "video") || null;
  }, [peerCallRef]);

  // ── Get the audio RTCRtpSender from the active PeerJS call ────────
  const getAudioSender = useCallback((): RTCRtpSender | null => {
    const call = peerCallRef.current;
    if (!call) return null;

    const pc = (call as any).peerConnection as RTCPeerConnection | undefined;
    if (!pc) return null;

    const senders = pc.getSenders();
    return senders.find((s) => s.track?.kind === "audio") || null;
  }, [peerCallRef]);

  // ── Stop screen share and restore camera ──────────────────────────
  const stopSharing = useCallback(() => {
    // 1. Stop all screen stream tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // 2. Restore the original camera video track on the PeerJS call
    const videoSender = getVideoSender();
    if (videoSender && originalVideoTrackRef.current) {
      videoSender.replaceTrack(originalVideoTrackRef.current).catch((e) => {
        console.error("❌ Failed to restore camera track:", e);
      });
    }

    // 3. Restore original audio track (remove screen audio if added)
    // No-op needed — original mic track was never removed,
    // and the screen audio sender (if added) was extra.
    // We clean up any extra audio tracks we may have added.
    const call = peerCallRef.current;
    if (call) {
      const pc = (call as any).peerConnection as RTCPeerConnection | undefined;
      if (pc) {
        const audioSenders = pc.getSenders().filter((s) => s.track?.kind === "audio");
        // If we have more than 1 audio sender, the extra one is screen audio — remove it
        if (audioSenders.length > 1) {
          // The last one added is the screen audio
          const screenAudioSender = audioSenders[audioSenders.length - 1];
          try {
            pc.removeTrack(screenAudioSender);
          } catch (e) {
            console.warn("Could not remove screen audio sender:", e);
          }
        }
      }
    }

    // 4. Restore local PiP video to show camera
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    originalVideoTrackRef.current = null;
    setIsSharing(false);
    console.log("🖥️ Screen sharing stopped, camera restored.");
  }, [getVideoSender, peerCallRef, localStreamRef, localVideoRef]);

  // ── Start screen share ────────────────────────────────────────────
  const startSharing = useCallback(async () => {
    if (!isConnected) return;

    const videoSender = getVideoSender();
    if (!videoSender) {
      console.warn("⚠️ No video sender found on PeerJS call. Cannot share screen.");
      return;
    }

    // Save the current camera video track so we can restore it later
    originalVideoTrackRef.current = videoSender.track;

    try {
      // Request screen capture — browser shows its own picker UI
      // { audio: true } enables the "Share tab audio" checkbox in Chrome
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          // @ts-ignore — Chrome-specific high quality hints
          displaySurface: "monitor",
        },
        audio: true, // Enables "Share tab audio" checkbox
      });

      screenStreamRef.current = screenStream;

      // ── Replace the video track on the call ────────────────────
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        await videoSender.replaceTrack(screenVideoTrack);

        // Listen for browser's native "Stop sharing" button
        screenVideoTrack.onended = () => {
          console.log("🖥️ Browser 'Stop sharing' clicked");
          stopSharing();
        };
      }

      // ── Add screen audio track if present ──────────────────────
      const screenAudioTrack = screenStream.getAudioTracks()[0];
      if (screenAudioTrack) {
        const call = peerCallRef.current;
        if (call) {
          const pc = (call as any).peerConnection as RTCPeerConnection | undefined;
          if (pc) {
            try {
              pc.addTrack(screenAudioTrack, screenStream);
              console.log("🔊 Screen audio track added to call");
            } catch (e) {
              console.warn("Could not add screen audio track:", e);
            }
          }
        }
      }

      // ── Update local PiP to show what's being shared ───────────
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsSharing(true);
      console.log("🖥️ Screen sharing started!");
    } catch (err: any) {
      // User cancelled the screen picker — not an error
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        console.log("Screen share cancelled by user.");
        originalVideoTrackRef.current = null;
        return;
      }
      console.error("❌ Screen sharing failed:", err);
      originalVideoTrackRef.current = null;
    }
  }, [isConnected, getVideoSender, peerCallRef, localVideoRef, stopSharing]);

  // ── Toggle handler ────────────────────────────────────────────────
  const handleToggle = () => {
    if (isSharing) {
      stopSharing();
    } else {
      startSharing();
    }
  };

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, []);

  // ── Auto-stop if call disconnects while sharing ───────────────────
  useEffect(() => {
    if (!isConnected && isSharing) {
      stopSharing();
    }
  }, [isConnected, isSharing, stopSharing]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleToggle}
      disabled={!isConnected}
      className={`p-3.5 rounded-full transition-all ${
        isSharing
          ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 ring-2 ring-indigo-500/30"
          : "bg-white/10 hover:bg-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed"
      }`}
      title={isSharing ? "Stop sharing" : "Share screen"}
    >
      {isSharing ? (
        <MonitorOff className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
    </button>
  );
}
