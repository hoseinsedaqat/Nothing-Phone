import { describe, it, expect } from 'vitest';

/**
 * Regression guard: every component stylesheet must be explicitly imported
 * by a TS/TSX module (or, for tokens.css, pulled in via global.css).
 * An unimported CSS file silently ships zero styles — the bug that left
 * AppWindow transparent so the home screen painted over every open app.
 */
const cssModules = import.meta.glob('../**/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const sourceModules = import.meta.glob('../**/*.{ts,tsx,css}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const allSource = Object.values(sourceModules).join('\n');
const cssPaths = Object.keys(cssModules);

describe('stylesheet coverage', () => {
  it.each(cssPaths.map((p) => [p.replace('../', ''), p] as const))(
    '%s is imported by a module',
    (_label, path) => {
      const name = path.split('/').pop()!;
      // global.css is the Vite entry stylesheet; tokens.css is pulled in via
      // its @import (bundlers may inline that before the raw read above).
      if (name === 'global.css' || name === 'tokens.css') return;
      expect(allSource).toContain(name);
    },
  );
});
