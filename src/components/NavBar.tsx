import { useRef } from 'react';
import { ChevronLeft, Square } from 'lucide-react';
import { useOS } from '../os/store';
import { haptic } from '../os/hooks';
import { playTick } from '../os/sound';
import './NavBar.css';

/**
 * Gesture navigation bar — Nothing style: a single home pill flanked by
 * soft glass back / recents buttons that stay faintly visible so the
 * controls are discoverable, and brighten on hover or press.
 */
export default function NavBar() {
  const goHome = useOS((s) => s.goHome);
  const setRecents = useOS((s) => s.setRecents);
  const recentsOpen = useOS((s) => s.recentsOpen);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const back = () => {
    haptic(8);
    playTick();
    window.dispatchEvent(new CustomEvent('os-back'));
  };
  const home = () => {
    haptic(10);
    playTick();
    goHome();
  };
  const recents = () => {
    haptic(10);
    playTick();
    setRecents(true);
  };

  return (
    <div className="nav-bar" data-tauri-drag-region>
      <button className="nav-btn nav-back" aria-label="Back" title="Back (or swipe the edge)" onClick={back}>
        <ChevronLeft size={21} strokeWidth={2.3} />
      </button>

      <button
        className="nav-pill"
        aria-label="Home"
        title="Home · long-press for recents"
        onClick={home}
        onPointerDown={() => {
          longTimer.current = setTimeout(() => {
            longTimer.current = null;
            recents();
          }, 450);
        }}
        onPointerUp={() => {
          if (longTimer.current) {
            clearTimeout(longTimer.current);
            longTimer.current = null;
          }
        }}
        onPointerLeave={() => {
          if (longTimer.current) {
            clearTimeout(longTimer.current);
            longTimer.current = null;
          }
        }}
      >
        <span className="nav-pill-inner" />
      </button>

      <button
        className={`nav-btn nav-recents ${recentsOpen ? 'active' : ''}`}
        aria-label="Recent apps"
        title="Recent apps"
        onClick={recents}
      >
        <Square size={14} strokeWidth={2.3} />
      </button>
    </div>
  );
}
