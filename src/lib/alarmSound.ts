/**
 * Alarm sound generator using Web Audio API.
 * Produces a looping alarm-like beep pattern without any external audio files.
 */

class AlarmSound {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  async start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.audioContext = new AudioContext();

      // Browsers suspend AudioContext until user gesture — resume it.
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.playPattern();
    } catch (err) {
      console.warn('[AlarmSound] Could not start audio:', err);
      this.isPlaying = false;
    }
  }

  stop() {
    this.isPlaying = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  get playing() {
    return this.isPlaying;
  }

  /**
   * Plays a repeating alarm pattern: three ascending beeps, pause, repeat.
   */
  private playPattern() {
    if (!this.isPlaying || !this.audioContext) return;

    // If context got suspended again (e.g. tab went to background), try to resume
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    const ctx = this.audioContext;

    // Three-tone ascending beep pattern
    this.beep(ctx, 660, 0.0, 0.15);
    this.beep(ctx, 660, 0.2, 0.15);
    this.beep(ctx, 880, 0.45, 0.25);

    // Repeat after a pause
    this.timeoutId = setTimeout(() => {
      this.playPattern();
    }, 1500);
  }

  private beep(ctx: AudioContext, frequency: number, startOffset: number, duration: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = frequency;
      osc.type = 'sine';

      const t = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02); // attack
      gain.gain.setValueAtTime(0.35, t + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, t + duration); // release

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Ignore individual beep errors
    }
  }
}

export const alarmSound = new AlarmSound();
