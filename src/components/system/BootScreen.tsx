import { useEffect } from 'react';
import { useOS } from '../../os/store';
import './BootScreen.css';

export default function BootScreen() {
  const setPower = useOS((s) => s.setPower);
  const setBootProgress = useOS((s) => s.setBootProgress);
  const progress = useOS((s) => s.bootProgress);

  useEffect(() => {
    let p = 0;
    const t = setInterval(() => {
      p += 4 + Math.random() * 7;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setTimeout(() => setPower('locked'), 350);
      }
      setBootProgress(Math.min(100, p));
    }, 110);
    return () => clearInterval(t);
  }, [setPower, setBootProgress]);

  return (
    <div className="boot-screen">
      <div className="boot-dot-grid" aria-hidden>
        {Array.from({ length: 64 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${(i % 8) * 70 + Math.floor(i / 8) * 90}ms` }} />
        ))}
      </div>
      <div className="boot-wordmark">Nothing</div>
      <div className="boot-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
      <p className="boot-sub">Phone (3) · Nothing OS 5.0</p>
    </div>
  );
}
