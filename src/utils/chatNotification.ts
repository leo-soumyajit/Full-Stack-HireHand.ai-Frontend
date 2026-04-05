/**
 * chatNotification.ts — Isolated chat notification sound utility.
 *
 * Uses Web Audio API to play a pleasant "ding" notification.
 * No external audio files needed. Zero dependencies.
 */

let audioCtx: AudioContext | null = null;

/**
 * Play a subtle, pleasant notification sound for incoming chat messages.
 * Uses two quick tones (like Google Meet / Slack notifications).
 * Silently fails if AudioContext is blocked or unavailable.
 */
export function playChatNotification(): void {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    // Resume context if suspended (Chrome autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // ── Tone 1: Short high note ───────────────────────────
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // ── Tone 2: Slightly higher, delayed ──────────────────
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1100, now + 0.12); // C#6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  } catch {
    // Silently fail — audio is non-critical
  }
}
