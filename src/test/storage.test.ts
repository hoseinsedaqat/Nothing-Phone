import { describe, it, expect } from 'vitest';
import { deepMerge, loadSlice, resetAllSlices, exportAllData, importAllData } from '../os/storage';

describe('storage resilience', () => {
  it('deepMerge fills missing fields but keeps persisted values', () => {
    const merged = deepMerge({ a: 1, nested: { x: 1, y: 2 } }, { nested: { x: 9 } });
    expect(merged).toEqual({ a: 1, nested: { x: 9, y: 2 } });
  });

  it('falls back to defaults when JSON is corrupt', () => {
    localStorage.setItem('np3:v1:system', '{not valid json');
    const value = loadSlice('system', { ok: true });
    expect(value).toEqual({ ok: true });
  });

  it('round-trips export and import', () => {
    localStorage.setItem('np3:v1:demo', JSON.stringify({ hello: 'world' }));
    const dump = exportAllData();
    localStorage.clear();
    expect(importAllData(dump)).toBe(true);
    expect(JSON.parse(localStorage.getItem('np3:v1:demo')!)).toEqual({ hello: 'world' });
  });

  it('rejects invalid import payloads', () => {
    expect(importAllData('not json')).toBe(false);
  });

  it('resetAllSlices removes only simulator keys', () => {
    localStorage.setItem('np3:v1:demo', '1');
    localStorage.setItem('other-key', '2');
    resetAllSlices();
    expect(localStorage.getItem('np3:v1:demo')).toBeNull();
    expect(localStorage.getItem('other-key')).toBe('2');
  });
});
