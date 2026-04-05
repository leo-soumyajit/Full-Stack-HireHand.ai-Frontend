/**
 * warningNotification.ts — Isolated warning notification sound utility.
 *
 * Uses Web Audio API to play an alert ding when candidate cheats (switches tabs).
 * Zero dependencies.
 */

let audioCtx: AudioContext | null = null;

export function playWarningNotification(): void {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // ── Tone 1: Low warning note ───────────────────────────
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(300, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // ── Tone 2: Dissonant lower note ──────────────────
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = "square";
    osc2.frequency.setValueAtTime(250, now + 0.1);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch {
    // Silently fail if blocked by browser
  }
}
