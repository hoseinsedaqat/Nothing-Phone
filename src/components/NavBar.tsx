import { ChevronLeft, Square } from 'lucide-react';
import { useOS } from '../os/store';
import { haptic } from '../os/hooks';
import './NavBar.css';

/**
 * Gesture navigation bar. The pill itself is the home target;
 * the invisible side zones handle back / recents for mouse users.
 */
export default function NavBar() {
  const goHome = useOS((s) => s.goHome);
  const setRecents = useOS((s) => s.setRecents);
  const recentsOpen = useOS((s) => s.recentsOpen);

  return (
    <div className="nav-bar" data-tauri-drag-region>
      <button
        className="nav-zone nav-back"
        aria-label="Back"
        onClick={() => {
          haptic(8);
          window.dispatchEvent(new CustomEvent('os-back'));
        }}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        className="nav-pill"
        aria-label="Home"
        onClick={() => {
          haptic(10);
          goHome();
        }}
      />
      <button
        className={`nav-zone nav-recents ${recentsOpen ? 'visible' : ''}`}
        aria-label="Recent apps"
        onClick={() => {
          haptic(10);
          setRecents(true);
        }}
      >
        <Square size={15} />
      </button>
    </div>
  );
}
