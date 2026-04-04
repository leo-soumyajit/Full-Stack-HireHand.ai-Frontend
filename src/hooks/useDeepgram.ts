import { useRef, useCallback } from "react";

/**
 * useDeepgram — Production-grade live transcription via Deepgram Nova-2.
 * 
 * Flow:
 * 1. Fetch a temporary API key from our backend (master key never exposed).
 * 2. Open a WebSocket to Deepgram's streaming endpoint.
 * 3. Feed raw audio blobs from MediaRecorder every 250ms.
 * 4. Deepgram returns transcript results in real-time.
 */
export function useDeepgram(onTranscript: (text: string, isFinal: boolean) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRunningRef = useRef(false);

  const start = useCallback(async (stream: MediaStream) => {
    if (isRunningRef.current) return;

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      // 1. Fetch temporary token from our secure backend
      const res = await fetch(`${API_BASE}/api/deepgram/token`);
      if (!res.ok) throw new Error("Failed to fetch Deepgram token");
      const { key } = await res.json();
      if (!key) throw new Error("Empty Deepgram token received");

      // 2. Open WebSocket to Deepgram
      // model=nova-2-general for best accuracy
      // language=en-IN for Indian English accent support
      // smart_format=true for punctuation and formatting
      // interim_results=true for live typing indicator
      const dgUrl = `wss://api.deepgram.com/v1/listen?model=nova-2-general&language=en-IN&smart_format=true&interim_results=true&punctuate=true&endpointing=300`;

      const socket = new WebSocket(dgUrl, ["token", key]);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("🟢 Deepgram WebSocket OPEN — streaming audio");
        isRunningRef.current = true;

        // 3. Start MediaRecorder to capture mic audio as webm/opus blobs
        try {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "audio/webm;codecs=opus",
          });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.addEventListener("dataavailable", (event: BlobEvent) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });

          // Send audio chunks every 250ms for low-latency transcription
          mediaRecorder.start(250);
        } catch (recErr) {
          console.error("MediaRecorder setup failed:", recErr);
        }
      };

      // 4. Handle incoming transcription results
      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          const transcript = data?.channel?.alternatives?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            onTranscript(transcript, data.is_final === true);
          }
        } catch (parseErr) {
          // Ignore non-JSON messages (e.g. metadata)
        }
      };

      socket.onerror = (err) => {
        console.error("Deepgram WebSocket error:", err);
      };

      socket.onclose = (event) => {
        console.log(`🔴 Deepgram WebSocket closed (code: ${event.code})`);
        isRunningRef.current = false;
      };

    } catch (err) {
      console.error("Deepgram initialization failed:", err);
    }
  }, [onTranscript]);

  const stop = useCallback(() => {
    isRunningRef.current = false;

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }

    // Close WebSocket gracefully
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: "CloseStream" }));
        socketRef.current.close();
      } catch { /* ignore */ }
      socketRef.current = null;
    }
  }, []);

  return { start, stop };
}
