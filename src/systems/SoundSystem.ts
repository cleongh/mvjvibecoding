export type SoundCue = 'sword' | 'hit' | 'hurt' | 'enemyAttack' | 'chest' | 'pickup' | 'heart' | 'unlock' | 'jewel' | 'confirm';

type Note = { frequency: number; duration: number; waveform?: OscillatorType; volume?: number };

const cues: Record<SoundCue, Note[]> = {
  sword: [{ frequency: 620, duration: 0.055, waveform: 'triangle', volume: 0.05 }, { frequency: 360, duration: 0.09, waveform: 'triangle', volume: 0.04 }],
  hit: [{ frequency: 170, duration: 0.12, waveform: 'square', volume: 0.055 }],
  hurt: [{ frequency: 220, duration: 0.12, waveform: 'sawtooth', volume: 0.055 }, { frequency: 150, duration: 0.18, waveform: 'triangle', volume: 0.05 }],
  enemyAttack: [{ frequency: 240, duration: 0.16, waveform: 'sawtooth', volume: 0.03 }],
  chest: [{ frequency: 440, duration: 0.08 }, { frequency: 660, duration: 0.08 }, { frequency: 880, duration: 0.18 }],
  pickup: [{ frequency: 720, duration: 0.07 }, { frequency: 980, duration: 0.1 }],
  heart: [{ frequency: 520, duration: 0.1 }, { frequency: 660, duration: 0.1 }, { frequency: 780, duration: 0.2 }],
  unlock: [{ frequency: 300, duration: 0.1 }, { frequency: 450, duration: 0.14 }],
  jewel: [{ frequency: 392, duration: 0.12 }, { frequency: 523, duration: 0.12 }, { frequency: 659, duration: 0.12 }, { frequency: 784, duration: 0.3 }],
  confirm: [{ frequency: 560, duration: 0.055, volume: 0.025 }],
};

export default class SoundSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;
  private readonly unlockHandler = (): void => {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
  };

  constructor() {
    window.addEventListener('pointerdown', this.unlockHandler, true);
    window.addEventListener('keydown', this.unlockHandler, true);
  }

  play(cue: SoundCue): void {
    this.unlockHandler();
    if (this.muted || !this.context || !this.master) return;
    const context = this.context;
    if (context.state !== 'running') {
      void context.resume().then(() => {
        if (!this.muted && this.context === context && context.state === 'running') this.playNotes(cue);
      });
      return;
    }
    this.playNotes(cue);
  }

  private playNotes(cue: SoundCue): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    let offset = 0;
    for (const note of cues[cue]) {
      const oscillator = this.context.createOscillator();
      const volume = this.context.createGain();
      const start = now + offset;
      const peak = Math.min(0.24, (note.volume ?? 0.08) * 1.8);
      oscillator.type = note.waveform ?? 'sine';
      oscillator.frequency.setValueAtTime(note.frequency, start);
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(peak, start + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
      oscillator.connect(volume);
      volume.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + note.duration + 0.01);
      offset += note.duration * 0.72;
    }
  }

  toggle(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  destroy(): void {
    window.removeEventListener('pointerdown', this.unlockHandler, true);
    window.removeEventListener('keydown', this.unlockHandler, true);
    if (this.context && this.context.state !== 'closed') void this.context.close();
  }
}
