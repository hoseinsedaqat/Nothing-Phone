/**
 * Tiny synthesized music player — a step sequencer built on Web Audio.
 * No audio assets: lead, bass, kick and hi-hat voices are all generated.
 * Self-contained context (media must keep playing under DND, unlike UI
 * chimes), gain follows the system media volume.
 */
import { useOS } from './store';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number; // seconds, for the progress UI
  wave: OscillatorType;
  scale: number[]; // semitone offsets from A4 (440 Hz)
  lead: (number | null)[]; // 16 steps, indices into scale or rests
  bass: (number | null)[];
  kick: boolean[];
  hat: boolean[];
}

const A4 = 440;
const semi = (offset: number) => A4 * Math.pow(2, offset / 12);

export const TRACKS: MusicTrack[] = [
  {
    id: 'glyph-demo',
    title: 'Glyph Demo',
    artist: 'Nothing Sounds · Synthwave',
    bpm: 104,
    duration: 132,
    wave: 'sawtooth',
    scale: [-12, -10, -8, -7, -5, -3, -1, 0, 2, 4],
    lead: [0, null, 4, null, 5, null, 4, 2, null, 0, null, 5, 4, null, 2, null],
    bass: [0, null, null, 0, null, null, 3, null, 0, null, null, 0, null, 5, null, null],
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false],
    hat: [false, false, true, false, false, false, true, true, false, false, true, false, false, true, true, false],
  },
  {
    id: 'dot-matrix-dreams',
    title: 'Dot Matrix Dreams',
    artist: 'Nothing Sounds · Ambient',
    bpm: 84,
    duration: 148,
    wave: 'triangle',
    scale: [-12, -9, -7, -5, -3, 0, 4, 7],
    lead: [7, null, null, 4, null, null, 5, null, 7, null, 4, null, 2, null, null, null],
    bass: [0, null, null, null, null, null, 0, null, 3, null, null, null, null, null, null, null],
    kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    hat: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, true, false],
  },
  {
    id: 'night-circuit',
    title: 'Night Circuit',
    artist: 'Nothing Sounds · Electro',
    bpm: 122,
    duration: 126,
    wave: 'square',
    scale: [-12, -10, -8, -5, -3, 0, 3, 5],
    lead: [5, 5, null, 3, 0, null, 3, 5, null, 7, 5, null, 3, 0, null, null],
    bass: [0, null, 0, null, 5, null, 5, null, 3, null, 3, null, 0, null, 0, null],
    kick: [true, false, true, false, true, false, false, true, true, false, true, false, true, true, false, true],
    hat: [true, true, false, true, true, true, false, true, true, true, false, true, true, false, true, true],
  },
];

export interface MusicSnapshot {
  track: MusicTrack;
  playing: boolean;
  position: number; // seconds
  duration: number;
  progress: number; // 0..1
}

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

class MusicEngine {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextNoteTime = 0;
  private playedAt = 0; // ctx time when current position anchor started
  private positionAnchor = 0;
  private trackIdx = 0;
  private playing = false;
  private listeners = new Set<() => void>();
  private snap: MusicSnapshot;

  constructor() {
    this.snap = this.buildSnapshot();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): MusicSnapshot => this.snap;

  private buildSnapshot(): MusicSnapshot {
    const track = TRACKS[this.trackIdx];
    const position = this.playing
      ? Math.min(track.duration, this.positionAnchor + (this.ctx!.currentTime - this.playedAt))
      : this.positionAnchor;
    return {
      track,
      playing: this.playing,
      position,
      duration: track.duration,
      progress: position / track.duration,
    };
  }

  private emit() {
    this.snap = this.buildSnapshot();
    this.listeners.forEach((fn) => fn());
  }

  private ensureCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.bus = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 3200;
        this.bus.connect(this.filter);
        this.filter.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private applyVolume() {
    if (!this.ctx || !this.bus) return;
    const v = Math.max(0, Math.min(1, useOS.getState().system.mediaVol / 100));
    this.bus.gain.setTargetAtTime(0.0001 + v * 0.5, this.ctx.currentTime, 0.05);
  }

  private voice(freq: number, time: number, dur: number, type: OscillatorType, gain: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(this.bus);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private kick(time: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    g.gain.setValueAtTime(0.22, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(g);
    g.connect(this.bus);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private hat(time: number) {
    if (!this.ctx || !this.bus) return;
    const len = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.bus);
    src.start(time);
    src.stop(time + 0.05);
  }

  private scheduleStep(step: number, time: number) {
    const t = TRACKS[this.trackIdx];
    const stepDur = 60 / t.bpm / 2; // eighth notes
    const lead = t.lead[step];
    if (lead !== null && lead !== undefined) {
      this.voice(semi(t.scale[lead % t.scale.length]), time, stepDur * 0.9, t.wave, 0.07);
    }
    const bass = t.bass[step];
    if (bass !== null && bass !== undefined) {
      this.voice(semi(t.scale[bass % t.scale.length] - 12), time, stepDur * 1.4, 'sine', 0.12);
    }
    if (t.kick[step]) this.kick(time);
    if (t.hat[step]) this.hat(time);
  }

  private scheduler = () => {
    if (!this.ctx) return;
    this.applyVolume();
    const stepDur = 60 / TRACKS[this.trackIdx].bpm / 2;
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 16;
    }
    // Auto-advance at track end
    const pos = this.positionAnchor + (this.ctx.currentTime - this.playedAt);
    if (pos >= TRACKS[this.trackIdx].duration) this.next(true);
    this.emit();
  };

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  play() {
    const ac = this.ensureCtx();
    if (!ac) return;
    this.applyVolume();
    this.playing = true;
    this.playedAt = ac.currentTime;
    this.nextNoteTime = ac.currentTime + 0.06;
    this.timer ??= setInterval(this.scheduler, 90);
    this.emit();
  }

  pause() {
    if (!this.ctx) return;
    this.positionAnchor = Math.min(
      TRACKS[this.trackIdx].duration,
      this.positionAnchor + (this.ctx.currentTime - this.playedAt),
    );
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit();
  }

  private loadTrack(idx: number, autoplay: boolean) {
    this.trackIdx = (idx + TRACKS.length) % TRACKS.length;
    this.step = 0;
    this.positionAnchor = 0;
    const wasPlaying = this.playing;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.playing = false;
    if (autoplay || wasPlaying) this.play();
    else this.emit();
  }

  next(auto = false) {
    this.loadTrack(this.trackIdx + 1, auto);
  }

  prev() {
    if (this.positionAnchor > 4) {
      this.loadTrack(this.trackIdx, this.playing); // restart current track
    } else {
      this.loadTrack(this.trackIdx - 1, this.playing);
    }
  }
}

export const music = new MusicEngine();
