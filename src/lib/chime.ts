'use client';

/**
 * A short two-note chime, synthesised on the spot — no audio file to load,
 * nothing to cache, and it weighs nothing until the moment it plays.
 *
 * Browsers only allow sound after the user has interacted with the page; a
 * context created before that starts 'suspended'. We close it and stay silent
 * rather than queueing audio to burst out later, which is how a notification
 * sound becomes a jump scare.
 */
export function playChime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    if (ctx.state === 'suspended') {
      void ctx.close();
      return;
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    // A gentle fifth: A5 then E6.
    const first = ctx.createOscillator();
    first.type = 'sine';
    first.frequency.value = 880;
    first.connect(gain);
    first.start(now);
    first.stop(now + 0.4);

    const second = ctx.createOscillator();
    second.type = 'sine';
    second.frequency.value = 1318.5;
    second.connect(gain);
    second.start(now + 0.14);
    second.stop(now + 0.85);

    window.setTimeout(() => void ctx.close(), 1_100);
  } catch {
    /* sound is decoration; never let it throw */
  }
}
