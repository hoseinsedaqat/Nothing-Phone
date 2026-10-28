// Versioned, segmented, crash-resilient persistence layer.
// Every top-level slice is stored under its own key so one corrupt
// slice can never take down the rest of the simulator.

const PREFIX = 'np3';
export const STORAGE_VERSION = 1;

const key = (slice: string) => `${PREFIX}:v${STORAGE_VERSION}:${slice}`;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Recursive merge: persisted values win, missing fields fall back to defaults. */
export function deepMerge<T>(defaults: T, persisted: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(persisted)) {
    return (persisted === undefined ? defaults : (persisted as T));
  }
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(persisted)) {
    if (v === undefined) continue;
    out[k] = k in (defaults as object) ? deepMerge((defaults as Record<string, unknown>)[k], v) : v;
  }
  return out as T;
}

export function loadSlice<T>(slice: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(slice));
    if (raw == null) return fallback;
    return deepMerge(fallback, JSON.parse(raw));
  } catch (err) {
    console.warn(`[storage] slice "${slice}" unreadable, using defaults`, err);
    return fallback;
  }
}

const writeQueue = new Map<string, unknown>();
let writeTimer: ReturnType<typeof setTimeout> | null = null;

export function queueSave(slice: string, value: unknown) {
  writeQueue.set(slice, value);
  if (writeTimer) return;
  writeTimer = setTimeout(flushSaves, 250);
}

export function flushSaves() {
  writeTimer = null;
  for (const [slice, value] of writeQueue) {
    try {
      localStorage.setItem(key(slice), JSON.stringify(value));
    } catch (err) {
      // Quota or serialization errors must never crash the UI.
      console.warn(`[storage] could not save slice "${slice}"`, err);
    }
  }
  writeQueue.clear();
}

export function resetSlice(slice: string) {
  try {
    localStorage.removeItem(key(slice));
  } catch {
    /* ignore */
  }
}

export function resetAllSlices() {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function exportAllData(): string {
  const dump: Record<string, unknown> = { version: STORAGE_VERSION, exportedAt: Date.now() };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`)) {
        dump[k] = JSON.parse(localStorage.getItem(k) ?? 'null');
      }
    }
  } catch {
    /* ignore */
  }
  return JSON.stringify(dump, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const dump = JSON.parse(json);
    if (typeof dump !== 'object' || dump === null) return false;
    Object.entries(dump).forEach(([k, v]) => {
      if (k.startsWith(`${PREFIX}:`)) localStorage.setItem(k, JSON.stringify(v));
    });
    return true;
  } catch {
    return false;
  }
}

export const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
