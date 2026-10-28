import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom lacks PointerEvent — alias it to MouseEvent; React dispatches by
// event name ('pointerdown'/'pointerup'), so the synthetic handlers still fire.
if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
