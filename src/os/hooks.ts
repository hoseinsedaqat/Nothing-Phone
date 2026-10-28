import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BackContext } from './back';

/** Ticking clock. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Lightweight vibration feedback where supported. */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export interface StackEntry {
  screen: string;
  params?: Record<string, unknown>;
}

/**
 * In-app navigation stack. The global 'os-back' event (gesture / back
 * button / Escape) pops the stack; when empty it exits to the home screen.
 */
export function useScreenStack(initial: string = 'main') {
  const [stack, setStack] = useState<StackEntry[]>([{ screen: initial }]);
  const current = stack[stack.length - 1];

  const push = useCallback((screen: string, params?: Record<string, unknown>) => {
    setStack((p) => [...p, { screen, params }]);
  }, []);
  const pop = useCallback(() => {
    setStack((p) => (p.length > 1 ? p.slice(0, -1) : p));
  }, []);
  const reset = useCallback((screen = initial) => setStack([{ screen }]), [initial]);
  const stackRef = useLatest(stack);
  const backCtx = useContext(BackContext);

  useEffect(() => {
    if (!backCtx) return;
    backCtx.register(() => {
      if (stackRef.current.length > 1) {
        setStack((p) => p.slice(0, -1));
        return true;
      }
      return false;
    });
  }, [backCtx, stackRef]);

  return { current, push, pop, reset, depth: stack.length };
}

/** Media query hook. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const fn = () => setMatches(mql.matches);
    fn();
    mql.addEventListener('change', fn);
    return () => mql.removeEventListener('change', fn);
  }, [query]);
  return matches;
}

/** Holds a value in a ref always pointing at the latest render. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
export function formatDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
