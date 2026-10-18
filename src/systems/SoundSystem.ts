export type SoundCue = 'sword' | 'boomerang' | 'bomb' | 'explosion' | 'hit' | 'hurt' | 'enemyAttack' | 'chest' | 'pickup' | 'heart' | 'unlock' | 'jewel' | 'confirm';

type Note = { frequency: number; duration: number; waveform?: OscillatorType; volume?: number };
type ThemeNote = readonly [beat: number, midi: number, duration: number, volume?: number];

type ThemeSection = {
  chords: number[][];
  melody: ThemeNote[];
  countermelody: ThemeNote[];
  harmony: ThemeNote[];
};

const themeSections: Record<'A' | 'B' | 'C', ThemeSection> = {
  A: {
    chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],
    melody: [
      [0, 62, 0.7], [0.75, 65, 0.45], [1.5, 69, 0.7], [2.5, 74, 0.45], [3, 72, 0.8],
      [4, 70, 0.7], [5, 69, 0.45], [5.5, 65, 0.7], [6.5, 62, 0.45], [7, 65, 0.8],
      [8, 65, 0.65], [9, 69, 0.45], [9.5, 72, 0.7], [10.5, 74, 0.45], [11, 77, 0.75],
      [12, 76, 0.65], [13, 72, 0.45], [13.5, 69, 0.7], [14.5, 65, 0.45], [15, 62, 0.9],
    ],
    countermelody: [
      [2, 57, 0.8, 0.018], [3.5, 60, 0.4, 0.015], [6, 62, 0.8, 0.018], [7.5, 65, 0.4, 0.015],
      [10, 60, 0.8, 0.018], [11.5, 65, 0.4, 0.015], [14, 55, 0.8, 0.018], [15.5, 57, 0.35, 0.015],
    ],
    harmony: [
      [0.5, 74, 0.55, 0.021], [2.5, 77, 0.45, 0.018], [4.5, 74, 0.55, 0.021], [6.5, 69, 0.45, 0.018],
      [8.5, 72, 0.55, 0.021], [10.5, 76, 0.45, 0.018], [12.5, 72, 0.55, 0.021], [14.5, 69, 0.45, 0.018],
    ],
  },
  B: {
    chords: [[43, 46, 50], [46, 50, 53], [50, 53, 57], [45, 49, 52]],
    melody: [
      [0, 67, 0.65], [0.75, 69, 0.4], [1.5, 74, 0.75], [2.5, 77, 0.45], [3, 79, 0.85],
      [4, 77, 0.65], [5, 74, 0.45], [5.5, 70, 0.75], [6.5, 69, 0.4], [7, 67, 0.9],
      [8, 69, 0.65], [9, 74, 0.45], [9.5, 77, 0.75], [10.5, 81, 0.4], [11, 79, 0.8],
      [12, 76, 0.65], [13, 73, 0.45], [13.5, 69, 0.75], [14.5, 64, 0.4], [15, 69, 0.95],
    ],
    countermelody: [
      [1, 62, 0.7, 0.02], [2.5, 65, 0.4, 0.016], [5, 58, 0.7, 0.02], [6.5, 62, 0.4, 0.016],
      [9, 62, 0.7, 0.02], [10.5, 65, 0.4, 0.016], [13, 57, 0.7, 0.02], [14.5, 61, 0.4, 0.016],
    ],
    harmony: [
      [0.5, 71, 0.5, 0.02], [2.5, 81, 0.55, 0.018], [4.5, 81, 0.5, 0.02], [6.5, 74, 0.55, 0.018],
      [8.5, 77, 0.5, 0.02], [10.5, 83, 0.55, 0.018], [12.5, 79, 0.5, 0.02], [14.5, 76, 0.55, 0.018],
    ],
  },
  C: {
    chords: [[46, 50, 53], [41, 45, 48], [43, 46, 50], [45, 49, 52]],
    melody: [
      [0, 74, 0.9], [1.5, 77, 0.55], [2.5, 81, 0.9], [4, 79, 0.7], [5, 77, 0.45], [6, 74, 0.9],
      [8, 72, 0.75], [9, 76, 0.45], [10, 79, 1.1], [12, 81, 0.7], [13, 79, 0.45], [14, 76, 1.2],
    ],
    countermelody: [
      [0, 62, 1.2, 0.022], [2, 65, 0.8, 0.018], [4, 60, 1.2, 0.022], [6, 65, 0.8, 0.018],
      [8, 58, 1.2, 0.022], [10, 62, 0.8, 0.018], [12, 57, 1.2, 0.022], [14, 61, 0.8, 0.018],
    ],
    harmony: [
      [0.5, 77, 0.8, 0.024], [2.5, 81, 0.7, 0.02], [4.5, 76, 0.8, 0.024], [6.5, 79, 0.7, 0.02],
      [8.5, 74, 0.8, 0.024], [10.5, 77, 0.7, 0.02], [12.5, 73, 0.8, 0.024], [14.5, 76, 0.7, 0.02],
    ],
  },
};

const themeForm: ReadonlyArray<readonly [section: 'A' | 'B' | 'C', intensity: number]> = [
  ['A', 0.82], ['A', 0.9], ['B', 1], ['A', 0.96], ['B', 1.08], ['C', 1.12], ['B', 1.16],
];

const midiFrequency = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

const cues: Record<SoundCue, Note[]> = {
  sword: [{ frequency: 620, duration: 0.055, waveform: 'triangle', volume: 0.05 }, { frequency: 360, duration: 0.09, waveform: 'triangle', volume: 0.04 }],
  boomerang: [{ frequency: 850, duration: 0.06, waveform: 'triangle' }, { frequency: 1120, duration: 0.08, waveform: 'sine' }],
  bomb: [{ frequency: 130, duration: 0.16, waveform: 'triangle' }, { frequency: 90, duration: 0.2, waveform: 'sine' }],
  explosion: [{ frequency: 100, duration: 0.24, waveform: 'sawtooth', volume: 0.08 }, { frequency: 55, duration: 0.32, waveform: 'triangle', volume: 0.1 }],
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
  private musicTimer: number | null = null;
  muted = false;
  private readonly unlockHandler = (): void => {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      void this.context.resume().then(() => this.startMusic());
    } else {
      this.startMusic();
    }
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

  private startMusic(): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== 'running' || this.musicTimer !== null) return;

    const beat = 60 / 96;
    const phraseStart = context.currentTime + 0.08;
    const arpeggio = [0, 1, 2, 1, 0, 1, 2, 1];
    const sectionDuration = beat * 16;

    themeForm.forEach(([sectionName, intensity], sectionIndex) => {
      const section = themeSections[sectionName];
      const sectionStart = phraseStart + sectionIndex * sectionDuration;

      section.chords.forEach((chord, bar) => {
        const barStart = sectionStart + bar * beat * 4;
        chord.forEach((midi) => {
          this.scheduleTone(midiFrequency(midi), barStart, beat * 3.8, 'triangle', 0.013 * intensity);
        });
        this.scheduleTone(midiFrequency(chord[0] - 12), barStart, beat * 1.75, 'sine', 0.032 * intensity);
        this.scheduleTone(midiFrequency(chord[2] - 12), barStart + beat * 2, beat * 1.7, 'sine', 0.024 * intensity);

        arpeggio.forEach((chordNote, step) => {
          const at = barStart + step * beat * 0.5;
          const midi = chord[chordNote] + 12;
          this.scheduleTone(midiFrequency(midi), at, beat * 0.34, 'sine', 0.009 * intensity);
        });

        this.scheduleDrum(barStart, 122, 0.026 * intensity);
        this.scheduleDrum(barStart + beat * 2, 82 + ((bar + sectionIndex) % 3) * 9, 0.018 * intensity);
        if ((bar + sectionIndex) % 2 === 1) {
          this.scheduleDrum(barStart + beat * 3, 104, 0.012 * intensity);
        }
      });

      section.melody.forEach(([at, midi, duration, volume = 0.04]) => {
        const start = sectionStart + at * beat;
        this.scheduleTone(midiFrequency(midi), start, duration * beat, 'triangle', volume * intensity);
        this.scheduleTone(midiFrequency(midi + 12), start, duration * beat * 0.72, 'sine', 0.008 * intensity);
      });

      section.countermelody.forEach(([at, midi, duration, volume = 0.018]) => {
        this.scheduleTone(midiFrequency(midi), sectionStart + at * beat, duration * beat, 'triangle', volume * intensity);
      });

      section.harmony.forEach(([at, midi, duration, volume = 0.02]) => {
        this.scheduleTone(midiFrequency(midi), sectionStart + at * beat, duration * beat, 'sine', volume * intensity);
      });
    });

    this.musicTimer = window.setTimeout(() => {
      this.musicTimer = null;
      this.startMusic();
    }, sectionDuration * themeForm.length * 1000 - 80);
  }

  private scheduleDrum(start: number, pitch: number, peak: number): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(pitch, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, pitch * 0.42), start + 0.18);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  }

  private scheduleTone(
    frequency: number,
    start: number,
    duration: number,
    waveform: OscillatorType,
    peak: number,
  ): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const attack = Math.min(0.12, duration * 0.2);
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + attack);
    envelope.gain.setValueAtTime(peak * 0.72, Math.max(start + attack, start + duration * 0.72));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  toggle(): boolean {
    this.muted = !this.muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.context.currentTime, 0.04);
    }
    return this.muted;
  }

  destroy(): void {
    window.removeEventListener('pointerdown', this.unlockHandler, true);
    window.removeEventListener('keydown', this.unlockHandler, true);
    if (this.musicTimer !== null) window.clearTimeout(this.musicTimer);
    if (this.context && this.context.state !== 'closed') void this.context.close();
  }
}
