// Utility to play pleasant notification chime using Web Audio API with audio fallback

let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // 3-tone harmonic chime: E5 (659.25Hz), B5 (987.77Hz), E6 (1318.51Hz)
      const tones = [
        { freq: 659.25, start: 0.0, dur: 0.35, gain: 0.4 },
        { freq: 987.77, start: 0.1, dur: 0.4, gain: 0.5 },
        { freq: 1318.51, start: 0.22, dur: 0.5, gain: 0.6 },
      ];

      tones.forEach(({ freq, start, dur, gain }) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
      return;
    }
  } catch (err) {
    console.warn('Web Audio synthesis error, falling back to audio file:', err);
  }

  // Fallback to HTML5 audio element
  try {
    const audio = new Audio('/sounds/notification.wav');
    audio.play().catch(() => {});
  } catch {}
}
