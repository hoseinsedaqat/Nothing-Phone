import { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Lock } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import { haptic } from '../../os/hooks';

/** PIN challenge for apps protected by the demo app-lock setting. */
export default function PinGate() {
  const pendingApp = useOS((s) => s.pendingApp);
  const pin = useOS((s) => s.system.pin);
  const setPendingApp = useOS((s) => s.setPendingApp);
  const openApp = useOS((s) => s.openApp);
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);
  if (!pendingApp) return null;
  const app = getApp(pendingApp);

  const press = (d: string) => {
    haptic(8);
    if (d === 'del') {
      setEntered((p) => p.slice(0, -1));
      return;
    }
    const next = entered + d;
    setEntered(next);
    if (pin && next.length === pin.length) {
      setTimeout(() => {
        if (next === pin) {
          const id = pendingApp;
          setPendingApp(null);
          setEntered('');
          openApp(id, true);
        } else {
          haptic([40, 40, 40]);
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setEntered('');
          }, 450);
        }
      }, 120);
    }
  };

  return (
    <motion.div
      className="pin-gate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={`pin-gate-card ${shake ? 'shake' : ''}`}>
        <span className="icon-tile" style={{ width: 52, height: 52, background: app.tile }}>
          <app.Icon size={28} />
        </span>
        <Lock size={15} className="lock-icon" />
        <p>Enter PIN to open {app.name}</p>
        <div className="pin-dots static-dots">
          {Array.from({ length: pin?.length ?? 4 }).map((_, i) => (
            <span key={i} className={i < entered.length ? 'filled' : ''} />
          ))}
        </div>
        <div className="pin-keys gate-keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (
            <button
              key={k || 'empty'}
              disabled={!k}
              onClick={() => k && press(k)}
              className={k === 'del' ? 'pin-del' : ''}
            >
              {k === 'del' ? <Delete size={20} /> : k}
            </button>
          ))}
        </div>
        <button className="pin-cancel" onClick={() => setPendingApp(null)}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
