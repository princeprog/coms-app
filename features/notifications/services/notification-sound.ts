"use client";

let context: AudioContext | undefined;

// Browsers require audio to be initialized/resumed inside a user gesture.
export function unlockNotificationAudio() {
  try {
    if (typeof AudioContext === "undefined") return;
    if (!context || context.state === "closed") context = new AudioContext();
    if (context.state === "suspended") void context.resume().catch(() => {});
  } catch {
    // Sound is optional: browser/device restrictions must not interrupt work.
  }
}

export function playNotificationChime() {
  if (!context || context.state !== "running") return;
  try {
    const start = context.currentTime;
    for (const [offset, frequency] of [
      [0, 660],
      [0.16, 880],
    ]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(0.07, start + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.26);
    }
  } catch {
    // Keep the badge/inbox usable when audio is unavailable.
  }
}
