/**
 * Synthesized UI sound engine — pure Web Audio, no audio assets.
 * Every sound is generated from oscillators / filtered noise so the
 * simulator works offline and inside the PWA service worker cache.
 */
import { useOS } from './store';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Must be called from a user gesture so browser autoplay rules allow audio. */
export function primeAudio() {
  ensureCtx();
}

/** Master kill switch: user setting + silent mode. DND also mutes UI chimes. */
function allowed(): boolean {
  const s = useOS.getState().system;
  return s.soundEffects && !s.silent && !s.dnd;
}

function applyMasterGain() {
  if (!ctx || !master) return;
  const v = Math.max(0, Math.min(1, useOS.getState().system.mediaVol / 100));
  master.gain.setTargetAtTime(0.0001 + v * 0.85, ctx.currentTime, 0.015);
}

interface ToneOpts {
  freq: number;
  freqEnd?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, freqEnd, duration, type = 'sine', gain = 0.18, delay = 0 }: ToneOpts) {
  const ac = ensureCtx();
  if (!ac || !master) return;
  applyMasterGain();
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.014);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function noiseBurst(duration: number, gain: number, filterFreq: number, type: BiquadFilterType = 'bandpass') {
  const ac = ensureCtx();
  if (!ac || !master) return;
  applyMasterGain();
  const len = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start();
  src.stop(ac.currentTime + duration + 0.02);
}

/** Soft two-note ascending chime — lock screen unlock. */
export function playUnlock() {
  if (!allowed()) return;
  tone({ freq: 659.25, duration: 0.1, gain: 0.16 });
  tone({ freq: 987.77, duration: 0.16, gain: 0.16, delay: 0.075 });
}

/** Muted descending two-note click — screen locks. */
export function playLock() {
  if (!allowed()) return;
  tone({ freq: 493.88, duration: 0.08, gain: 0.12 });
  tone({ freq: 329.63, duration: 0.12, gain: 0.12, delay: 0.06 });
}

/** Electronic "power-up" sweep — Glyph LEDs light up / torch on. */
export function playGlyphOn() {
  if (!allowed()) return;
  tone({ freq: 320, freqEnd: 880, duration: 0.16, type: 'triangle', gain: 0.12 });
  tone({ freq: 1320, duration: 0.08, type: 'sine', gain: 0.06, delay: 0.1 });
}

/** Power-down sweep — Glyph LEDs / torch switch off. */
export function playGlyphOff() {
  if (!allowed()) return;
  tone({ freq: 720, freqEnd: 240, duration: 0.14, type: 'triangle', gain: 0.1 });
}

/** Mechanical shutter — camera capture. */
export function playShutter() {
  if (!allowed()) return;
  noiseBurst(0.07, 0.28, 1900);
  tone({ freq: 140, duration: 0.05, type: 'square', gain: 0.08 });
}

/** Gentle notification chime. */
export function playNotification() {
  if (!allowed()) return;
  tone({ freq: 880, duration: 0.09, gain: 0.12 });
  tone({ freq: 1174.66, duration: 0.14, gain: 0.12, delay: 0.09 });
}

/** Subtle tick for switches, quick toggles and PIN keys. */
export function playTick() {
  if (!allowed()) return;
  tone({ freq: 1250, duration: 0.035, type: 'sine', gain: 0.05 });
}

/** Authentic DTMF dual-tone for the dialer keypad. */
const DTMF: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

export function playDialTone(digit: string) {
  if (!allowed()) return;
  const pair = DTMF[digit];
  if (!pair) return;
  pair.forEach((freq) => tone({ freq, duration: 0.13, gain: 0.07 }));
}

/** Ringtone preview used in Settings. */
export function playRingtonePreview() {
  if (!useOS.getState().system.soundEffects) return;
  tone({ freq: 587.33, duration: 0.12, gain: 0.14 });
  tone({ freq: 783.99, duration: 0.12, gain: 0.14, delay: 0.12 });
  tone({ freq: 987.77, duration: 0.2, gain: 0.14, delay: 0.24 });
}
