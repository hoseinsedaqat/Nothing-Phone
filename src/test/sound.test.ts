import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOS } from '../os/store';
import * as sound from '../os/sound';

class FakeNode {
  connect = vi.fn(() => this);
  start = vi.fn();
  stop = vi.fn();
  frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
  type = '';
  Q = { value: 0 };
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = 'running';
  currentTime = 0;
  sampleRate = 22050;
  destination = {};
  createOscillator = vi.fn(() => new FakeNode());
  createGain = vi.fn(() => new FakeNode());
  createBuffer = vi.fn((_ch: number, len: number) => ({ getChannelData: () => new Float32Array(len) }));
  createBufferSource = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null }));
  createBiquadFilter = vi.fn(() => new FakeNode());
  resume = vi.fn();
  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', FakeAudioContext);
  useOS.getState().patchSystem({ soundEffects: true, silent: false, dnd: false, mediaVol: 60 });
  sound.primeAudio(); // ensure the module-scoped graph exists, then clear its mock history
  const ctx = FakeAudioContext.instances[0];
  ctx.createOscillator.mockClear();
  ctx.createBufferSource.mockClear();
});

describe('sound engine', () => {
  it('plays the unlock chime as two synthesized notes', () => {
    sound.playUnlock();
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(2);
  });

  it('plays lock and glyph power sounds through the shared audio graph', () => {
    sound.playLock();
    sound.playGlyphOn();
    sound.playGlyphOff();
    // lock = 2 notes, glyph on = 2 tones, glyph off = 1 tone
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(5);
  });

  it('synthesizes a noise burst for the camera shutter', () => {
    sound.playShutter();
    expect(FakeAudioContext.instances[0].createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('stays silent when sound effects are disabled', () => {
    useOS.getState().patchSystem({ soundEffects: false });
    sound.playLock();
    sound.playGlyphOn();
    sound.playShutter();
    expect(FakeAudioContext.instances[0].createOscillator).not.toHaveBeenCalled();
  });

  it('stays silent in DND mode', () => {
    useOS.getState().patchSystem({ dnd: true });
    sound.playNotification();
    expect(FakeAudioContext.instances[0].createOscillator).not.toHaveBeenCalled();
  });

  it('synthesizes DTMF pairs for dialer digits and ignores unmapped ones', () => {
    sound.playDialTone('5');
    expect(FakeAudioContext.instances[0].createOscillator).toHaveBeenCalledTimes(2);
    expect(() => sound.playDialTone('unknown')).not.toThrow();
  });

  it('never throws when Web Audio is unavailable', async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    const fresh = await import('../os/sound');
    expect(() => {
      fresh.playUnlock();
      fresh.playShutter();
      fresh.playTick();
    }).not.toThrow();
  });
});
