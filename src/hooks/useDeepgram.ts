import { useRef, useCallback } from "react";

/**
 * useDeepgram — Production-grade live transcription via Deepgram Nova-2.
 *
 * ARCHITECTURE:
 * 1. Fetch a temporary API key from our backend (master key never exposed).
 * 2. Open a WebSocket to Deepgram's streaming endpoint.
 * 3. CLONE the audio track (so PeerJS WebRTC is NOT affected).
 * 4. Feed cloned audio via MediaRecorder every 250ms.
 * 5. Deepgram returns transcript results in real-time.
 * 6. AUTO-RECONNECT on unexpected close (code 1011, network drops, etc.)
 */

// Find a supported audio MIME type for MediaRecorder
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "", // empty = browser default
  ];
  for (const t of types) {
    if (t === "" || MediaRecorder.isTypeSupported(t)) {
      console.log(`🎙️ Using MediaRecorder MIME: "${t || "browser-default"}"`);
      return t;
    }
  }
  return "";
}

export function useDeepgram(
  onTranscript: (text: string, isFinal: boolean) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const clonedTrackRef = useRef<MediaStreamTrack | null>(null);
  const isRunningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  // ── Auto-reconnect state ──
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const userStoppedRef = useRef(false); // true = user called stop(), don't reconnect
  const MAX_RECONNECT_ATTEMPTS = 5;

  // ── Cleanup internals without triggering reconnect ──
  const cleanupInternals = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null;
    }
    if (clonedTrackRef.current) {
      clonedTrackRef.current.stop();
      clonedTrackRef.current = null;
    }
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      try {
        socketRef.current.send(JSON.stringify({ type: "CloseStream" }));
        socketRef.current.close();
      } catch {
        /* ignore */
      }
    }
    socketRef.current = null;
  }, []);

  // ── Core connection logic (used for initial + reconnect) ──
  const connectToDeepgram = useCallback(
    async (stream: MediaStream) => {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

      try {
        // 1. Fetch temporary token from our secure backend
        console.log("🔑 Fetching Deepgram token...");
        const res = await fetch(`${API_BASE}/api/deepgram/token`);
        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        const { key } = await res.json();
        if (!key) throw new Error("Empty Deepgram token received");
        console.log("🔑 Deepgram token acquired");

        // 2. Open WebSocket to Deepgram
        const dgUrl =
          "wss://api.deepgram.com/v1/listen?" +
          "model=nova-2-general&" +
          "language=en-IN&" +
          "smart_format=true&" +
          "interim_results=true&" +
          "punctuate=true&" +
          "endpointing=300";

        const socket = new WebSocket(dgUrl, ["token", key]);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("🟢 Deepgram WebSocket OPEN — starting audio capture");
          isRunningRef.current = true;
          reconnectAttemptsRef.current = 0; // Reset on successful connect

          try {
            const mimeType = getSupportedMimeType();
            const options: MediaRecorderOptions = {};
            if (mimeType) options.mimeType = mimeType;

            // ═══════════════════════════════════════════════════════════
            // CRITICAL: Clone the audio track so PeerJS WebRTC is NOT
            // disrupted. Sharing the same track object between
            // MediaRecorder and RTCPeerConnection causes Chrome to
            // break the media pipeline → no audio/video for remote peer.
            // ═══════════════════════════════════════════════════════════
            const originalAudioTrack = stream.getAudioTracks()[0];
            if (!originalAudioTrack) {
              console.error("No audio track found in stream!");
              return;
            }

            const clonedTrack = originalAudioTrack.clone();
            clonedTrackRef.current = clonedTrack;
            const audioOnlyStream = new MediaStream([clonedTrack]);

            const mediaRecorder = new MediaRecorder(audioOnlyStream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.addEventListener(
              "dataavailable",
              (event: BlobEvent) => {
                if (
                  event.data.size > 0 &&
                  socket.readyState === WebSocket.OPEN
                ) {
                  socket.send(event.data);
                }
              }
            );

            // Send audio chunks every 250ms for low-latency transcription
            mediaRecorder.start(250);
            console.log(
              "🎙️ MediaRecorder started (cloned track) — sending audio to Deepgram"
            );
          } catch (recErr) {
            console.error("MediaRecorder setup failed:", recErr);
            // Ultimate fallback: use AudioContext (does not touch original tracks)
            startRawAudioFallback(stream, socket);
          }
        };

        // 4. Handle incoming transcription results
        socket.onmessage = (message) => {
          try {
            const data = JSON.parse(message.data);
            const transcript =
              data?.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim()) {
              onTranscript(transcript, data.is_final === true);
            }
          } catch {
            // Ignore non-JSON messages (metadata, keep-alives)
          }
        };

        socket.onerror = (err) => {
          console.error("Deepgram WebSocket error:", err);
        };

        socket.onclose = (event) => {
          console.log(
            `🔴 Deepgram WebSocket closed (code: ${event.code})`
          );
          isRunningRef.current = false;

          // ══════════════════════════════════════════════════════════════
          // AUTO-RECONNECT: If the close was NOT user-initiated and
          // we haven't exhausted retry attempts, reconnect automatically.
          // Close code 1000 = normal closure (user-initiated via stop())
          // Close code 1011 = server error (Deepgram internal issue)
          // Any other code = unexpected disconnect
          // ══════════════════════════════════════════════════════════════
          if (
            !userStoppedRef.current &&
            event.code !== 1000 &&
            reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
          ) {
            reconnectAttemptsRef.current += 1;
            const delay = Math.min(
              2000 * Math.pow(1.5, reconnectAttemptsRef.current - 1),
              15000
            ); // exponential backoff: 2s, 3s, 4.5s, 6.75s, 10s

            console.log(
              `🔄 Deepgram auto-reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay / 1000)}s...`
            );

            // Clean up old MediaRecorder & cloned track before reconnecting
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== "inactive"
            ) {
              try {
                mediaRecorderRef.current.stop();
              } catch {
                /* ignore */
              }
              mediaRecorderRef.current = null;
            }
            if (clonedTrackRef.current) {
              clonedTrackRef.current.stop();
              clonedTrackRef.current = null;
            }

            reconnectTimerRef.current = setTimeout(() => {
              if (!userStoppedRef.current && streamRef.current) {
                // Verify the original audio track is still alive
                const audioTrack = streamRef.current.getAudioTracks()[0];
                if (audioTrack && audioTrack.readyState === "live") {
                  console.log("🔄 Reconnecting to Deepgram...");
                  connectToDeepgram(streamRef.current);
                } else {
                  console.warn(
                    "⚠️ Original audio track is dead — cannot reconnect Deepgram"
                  );
                }
              }
            }, delay);
          } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.warn(
              `⚠️ Deepgram reconnect exhausted (${MAX_RECONNECT_ATTEMPTS} attempts). Transcription stopped.`
            );
          }
        };
      } catch (err) {
        console.error("Deepgram initialization failed:", err);

        // Also retry on init failure (e.g. token fetch failed due to network)
        if (
          !userStoppedRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = 3000 * reconnectAttemptsRef.current;
          console.log(
            `🔄 Deepgram init retry ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay / 1000}s...`
          );
          reconnectTimerRef.current = setTimeout(() => {
            if (!userStoppedRef.current && streamRef.current) {
              connectToDeepgram(streamRef.current);
            }
          }, delay);
        }
      }
    },
    [onTranscript, cleanupInternals]
  );

  // ── Public: start transcription ──
  const start = useCallback(
    async (stream: MediaStream) => {
      if (isRunningRef.current) return;
      userStoppedRef.current = false;
      reconnectAttemptsRef.current = 0;
      streamRef.current = stream;
      await connectToDeepgram(stream);
    },
    [connectToDeepgram]
  );

  // ── Public: stop transcription ──
  const stop = useCallback(() => {
    userStoppedRef.current = true; // Prevent auto-reconnect
    isRunningRef.current = false;

    // Cancel any pending reconnect
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    cleanupInternals();
    streamRef.current = null;
  }, [cleanupInternals]);

  return { start, stop };
}

/**
 * Fallback: If MediaRecorder fails entirely, use Web Audio API
 * to send raw Linear16 PCM at 16kHz. This also uses a cloned
 * track to avoid disrupting PeerJS.
 */
function startRawAudioFallback(stream: MediaStream, socket: WebSocket) {
  console.log("⚠️ Falling back to raw PCM audio via AudioContext");

  try {
    const originalTrack = stream.getAudioTracks()[0];
    if (!originalTrack) return;

    const clonedTrack = originalTrack.clone();
    const clonedStream = new MediaStream([clonedTrack]);

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(clonedStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (socket.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      socket.send(int16.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    console.log("🎙️ Raw PCM audio streaming started (cloned track, 16kHz)");
  } catch (err) {
    console.error("Raw audio fallback also failed:", err);
  }
}
