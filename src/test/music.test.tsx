import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { useOS } from '../os/store';
import { music, TRACKS } from '../os/music';
import { playRingtone, playCharge, playUnplug } from '../os/sound';
import ChargingOverlay from '../components/system/ChargingOverlay';

class FakeNode {
  connect = vi.fn(() => this);
  start = vi.fn();
  stop = vi.fn();
  frequency = {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
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
  static totalOscillations = 0;
  state = 'running';
  currentTime = 0;
  sampleRate = 22050;
  destination = {};
  createOscillator = vi.fn(() => {
    FakeAudioContext.totalOscillations += 1;
    return new FakeNode();
  });
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
  FakeAudioContext.instances = [];
  FakeAudioContext.totalOscillations = 0;
  useOS.getState().patchSystem({ soundEffects: true, silent: false, dnd: false, mediaVol: 60 });
});

afterEach(() => {
  music.pause();
  vi.useRealTimers();
});

describe('music engine', () => {
  it('starts and stops playback without throwing', () => {
    expect(music.getSnapshot().playing).toBe(false);
    music.play();
    expect(music.getSnapshot().playing).toBe(true);
    expect(FakeAudioContext.instances.length).toBeGreaterThan(0);
    music.pause();
    expect(music.getSnapshot().playing).toBe(false);
  });

  it('cycles through all tracks with next/prev', () => {
    const first = music.getSnapshot().track.id;
    music.next();
    expect(music.getSnapshot().track.id).not.toBe(first);
    music.prev();
    expect(music.getSnapshot().track.id).toBe(first);
    expect(TRACKS.length).toBe(3);
  });

  it('exposes a progress value between 0 and 1', () => {
    const snap = music.getSnapshot();
    expect(snap.progress).toBeGreaterThanOrEqual(0);
    expect(snap.progress).toBeLessThanOrEqual(1);
    expect(snap.duration).toBeGreaterThan(0);
  });

  it('schedules sequencer steps on an interval while playing', () => {
    vi.useFakeTimers();
    music.play();
    const before = FakeAudioContext.totalOscillations;
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(FakeAudioContext.totalOscillations).toBeGreaterThan(before);
  });
});

describe('ringtone melodies', () => {
  it('plays every audible ringtone without throwing', () => {
    for (const name of ['Nothing Chime', 'Glyph Tone', 'Dot Matrix', 'Minimal Bell', 'Deep Pulse']) {
      expect(() => playRingtone(name)).not.toThrow();
    }
  });

  it('refuses to play the silent ringtone', () => {
    expect(playRingtone('Silent (vibrate only)')).toBe(false);
  });

  it('charge and unplug sounds never throw', () => {
    expect(() => {
      playCharge();
      playUnplug();
    }).not.toThrow();
  });
});

describe('ChargingOverlay', () => {
  it('renders the charging animation while shown and hides afterwards', async () => {
    const { rerender, queryByText } = render(<ChargingOverlay show />);
    expect(queryByText('Charging')).toBeInTheDocument();
    rerender(<ChargingOverlay show={false} />);
    await waitFor(() => expect(queryByText('Charging')).not.toBeInTheDocument());
  });

  it('does not block pointer events', () => {
    const { container } = render(<ChargingOverlay show />);
    expect(container.firstElementChild).toHaveStyle({ pointerEvents: 'none' });
  });
});
