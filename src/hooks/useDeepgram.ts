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

// Find a supported audio MIME type for MediaRecorder
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
    "",  // empty = browser default
  ];
  for (const t of types) {
    if (t === "" || MediaRecorder.isTypeSupported(t)) {
      console.log(`🎙️ Using MediaRecorder MIME: "${t || "browser-default"}"`);
      return t;
    }
  }
  return "";
}

export function useDeepgram(onTranscript: (text: string, isFinal: boolean) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRunningRef = useRef(false);

  const start = useCallback(async (stream: MediaStream) => {
    if (isRunningRef.current) return;

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
      // model=nova-2-general → best accuracy
      // language=en-IN → Indian English accent support  
      // smart_format=true → auto punctuation & formatting
      // interim_results=true → live typing indicator
      // endpointing=300 → faster sentence breaks
      const dgUrl = `wss://api.deepgram.com/v1/listen?model=nova-2-general&language=en-IN&smart_format=true&interim_results=true&punctuate=true&endpointing=300`;

      const socket = new WebSocket(dgUrl, ["token", key]);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("🟢 Deepgram WebSocket OPEN — streaming audio");
        isRunningRef.current = true;

        // 3. Start MediaRecorder with a supported MIME type
        try {
          const mimeType = getSupportedMimeType();
          const options: MediaRecorderOptions = {};
          if (mimeType) options.mimeType = mimeType;

          // CRITICAL FIX: Extract only the audio track! 
          // Chromium throws NotSupportedError if you pass a stream with a video track to an audio/* mimeType
          const audioStream = new MediaStream(stream.getAudioTracks());
          const mediaRecorder = new MediaRecorder(audioStream, options);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.addEventListener("dataavailable", (event: BlobEvent) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });

          // Send audio chunks every 250ms for low-latency transcription
          mediaRecorder.start(250);
          console.log("🎙️ MediaRecorder started — sending audio to Deepgram");
        } catch (recErr) {
          console.error("MediaRecorder setup failed:", recErr);
          // Ultimate fallback: use AudioContext to send raw PCM
          startRawAudioFallback(stream, socket);
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
        } catch {
          // Ignore non-JSON messages (metadata, keep-alives)
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

/**
 * Fallback: If MediaRecorder doesn't support any webm/ogg type,
 * use Web Audio API to send raw Linear16 PCM at 16kHz directly.
 * This works on ALL browsers including Safari.
 */
function startRawAudioFallback(stream: MediaStream, socket: WebSocket) {
  console.log("⚠️ Falling back to raw PCM audio via AudioContext");
  
  try {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert float32 to int16
      const int16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      socket.send(int16.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    console.log("🎙️ Raw PCM audio streaming started (16kHz Linear16)");
  } catch (err) {
    console.error("Raw audio fallback also failed:", err);
  }
}
