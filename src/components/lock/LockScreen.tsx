import { useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flashlight, Camera, Lock, ChevronUp, Delete, X } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import { useNow, formatTime, formatDate, haptic } from '../../os/hooks';
import './LockScreen.css';

export default function LockScreen() {
  const now = useNow();
  const sys = useOS((s) => s.system);
  const notifications = useOS((s) => s.notifications);
  const dismiss = useOS((s) => s.dismissNotification);
  const openApp = useOS((s) => s.openApp);
  const setPower = useOS((s) => s.setPower);
  const patchSystem = useOS((s) => s.patchSystem);
  const [pinMode, setPinMode] = useState(false);
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);
  const startY = useState<{ y: number } | null>(null);

  const unlock = () => {
    haptic([15, 60, 20]);
    setPower('unlocked');
  };

  const tryUnlock = () => {
    if (!sys.pin) {
      unlock();
      return;
    }
    setPinMode(true);
  };

  const pressDigit = (d: string) => {
    haptic(8);
    if (d === 'del') {
      setEntered((p) => p.slice(0, -1));
      return;
    }
    const next = entered + d;
    setEntered(next);
    if (next.length === sys.pin!.length) {
      setTimeout(() => {
        if (next === sys.pin) unlock();
        else {
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

  const onDown = (e: RPointerEvent) => {
    startY[1]({ y: e.clientY });
  };
  const onUp = (e: RPointerEvent) => {
    const s = startY[0];
    startY[1](null);
    if (s && s.y - e.clientY > 70) tryUnlock();
  };

  return (
    <motion.div
      className="lock-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="lock-top">
        <Lock size={13} className="lock-icon" />
        <div className="lock-clock">{formatTime(now)}</div>
        <div className="lock-date">{formatDate(now)}</div>
        <div className="lock-battery">
          <span className="lock-battery-pill">
            <span style={{ width: `${sys.batteryLevel}%` }} />
          </span>
          {sys.batteryLevel}%{sys.charging ? ' · charging' : ''}
        </div>
      </div>

      <div className="lock-notifs app-scroll">
        {!sys.lockNotifications ? (
          <p className="lock-empty">Notifications are hidden on the lock screen</p>
        ) : notifications.length === 0 ? (
          <p className="lock-empty">No notifications</p>
        ) : null}
        <AnimatePresence>
          {sys.lockNotifications && notifications.slice(0, 4).map((n) => {
            const app = getApp(n.appId);
            return (
              <motion.div
                key={n.id}
                className="lock-notif"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60 }}
                onClick={() => {
                  dismiss(n.id);
                  setPower('unlocked');
                  setTimeout(() => openApp(n.appId), 260);
                }}
              >
                <span className="icon-tile" style={{ background: app.tile, width: 34, height: 34 }}>
                  <app.Icon size={20} />
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.text}</p>
                </div>
                <button
                  className="lock-notif-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(n.id);
                  }}
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="lock-bottom" onPointerDown={onDown} onPointerUp={onUp}>
        <div className="lock-shortcuts">
          <button
            className={`lock-circle ${sys.flashlight ? 'on' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              haptic(15);
              patchSystem({ flashlight: !sys.flashlight });
            }}
            aria-label="Flashlight"
          >
            <Flashlight size={19} />
          </button>
          <button
            className="lock-circle"
            onClick={(e) => {
              e.stopPropagation();
              setPower('unlocked');
              setTimeout(() => openApp('camera'), 260);
            }}
            aria-label="Camera"
          >
            <Camera size={19} />
          </button>
        </div>
        {!pinMode && (
          <div className="swipe-hint">
            <ChevronUp size={20} className="animate-blink" />
            <span>Swipe up to unlock</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pinMode && (
          <motion.div
            className={`pin-pad ${shake ? 'shake' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <p className="pin-title">Enter PIN</p>
            <div className="pin-dots">
              {Array.from({ length: sys.pin!.length }).map((_, i) => (
                <span key={i} className={i < entered.length ? 'filled' : ''} />
              ))}
            </div>
            <div className="pin-keys">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (
                <button
                  key={k || 'empty'}
                  disabled={!k}
                  onClick={() => k && pressDigit(k)}
                  className={k === 'del' ? 'pin-del' : ''}
                >
                  {k === 'del' ? <Delete size={22} /> : k}
                </button>
              ))}
            </div>
            <button className="pin-cancel" onClick={() => setPinMode(false)}>
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
