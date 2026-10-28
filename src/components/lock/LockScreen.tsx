import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flashlight, Camera, Lock, Delete, X, CloudSun, ChevronUp } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import { useData } from '../../os/dataStore';
import { useNow, formatTime, haptic } from '../../os/hooks';
import DotClock from '../DotClock';
import './LockScreen.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function LockScreen() {
  const now = useNow();
  const sys = useOS((s) => s.system);
  const notifications = useOS((s) => s.notifications);
  const dismiss = useOS((s) => s.dismissNotification);
  const openApp = useOS((s) => s.openApp);
  const setPower = useOS((s) => s.setPower);
  const patchSystem = useOS((s) => s.patchSystem);
  const weather = useData((s) => s.weather[0]);
  const [pinMode, setPinMode] = useState(false);
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);
  const press = useRef<{ x: number; y: number; t: number } | null>(null);

  const unlock = () => {
    haptic([12, 50, 16]);
    setPower('unlocked');
  };

  const requestUnlock = () => {
    if (sys.pin) {
      setPinMode(true);
      haptic(10);
    } else {
      unlock();
    }
  };

  const pressDigit = (d: string) => {
    haptic(7);
    if (d === 'del') {
      setEntered((p) => p.slice(0, -1));
      return;
    }
    const next = entered + d;
    setEntered(next);
    if (sys.pin && next.length === sys.pin.length) {
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

  // A simple tap (or a swipe up) anywhere unlocks the phone.
  const onDown = (e: RPointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onUp = (e: RPointerEvent) => {
    if (!press.current) return;
    const dy = press.current.y - e.clientY;
    const dt = Date.now() - press.current.t;
    press.current = null;
    if (pinMode) return;
    if (dy > 60 || dt < 400) requestUnlock();
  };

  return (
    <motion.div
      className="lock-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      <div className="lock-status">
        <Lock size={12} />
      </div>

      <div className="lock-clock-block">
        <DotClock value={formatTime(now)} size={84} />
        <p className="lock-date">
          {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
        </p>
        {weather && (
          <p className="lock-weather">
            <CloudSun size={14} /> {weather.temp}° {weather.condition.toUpperCase()}
          </p>
        )}
      </div>

      {sys.lockNotifications && (
        <div className="lock-notifs">
          <AnimatePresence>
            {notifications.slice(0, 2).map((n) => {
              const app = getApp(n.appId);
              return (
                <motion.button
                  key={n.id}
                  className="lock-notif"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(n.id);
                    if (sys.pin) setPinMode(true);
                    else {
                      setPower('unlocked');
                      setTimeout(() => openApp(n.appId), 240);
                    }
                  }}
                >
                  <span className="icon-tile" style={{ background: app.tile, width: 32, height: 32 }}>
                    <app.Icon size={18} />
                  </span>
                  <span className="lock-notif-text">
                    <strong>{n.title}</strong>
                    <small>{n.text}</small>
                  </span>
                  <span
                    className="lock-notif-x"
                    role="button"
                    aria-label="Dismiss"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                  >
                    <X size={13} />
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {notifications.length > 2 && <p className="lock-notif-more">+{notifications.length - 2} more notifications</p>}
        </div>
      )}

      <div className="lock-bottom" onPointerDown={(e) => e.stopPropagation()}>
        <button
          className={`lock-circle ${sys.flashlight ? 'on' : ''}`}
          onClick={() => {
            haptic(14);
            patchSystem({ flashlight: !sys.flashlight });
          }}
          aria-label="Flashlight"
        >
          <Flashlight size={19} />
        </button>
        <button className="lock-hint" onClick={requestUnlock} aria-label="Unlock">
          <ChevronUp size={18} className="animate-blink" />
        </button>
        <button
          className="lock-circle"
          onClick={() => {
            if (sys.pin) setPinMode(true);
            else {
              setPower('unlocked');
              setTimeout(() => openApp('camera'), 240);
            }
          }}
          aria-label="Camera"
        >
          <Camera size={19} />
        </button>
      </div>

      <AnimatePresence>
        {pinMode && sys.pin && (
          <motion.div
            className={`pin-pad ${shake ? 'shake' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className="pin-title">Enter PIN</p>
            <div className="pin-dots">
              {Array.from({ length: sys.pin.length }).map((_, i) => (
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
                  aria-label={k || 'empty'}
                >
                  {k === 'del' ? <Delete size={22} /> : k}
                </button>
              ))}
            </div>
            <button className="pin-cancel" onClick={() => { setPinMode(false); setEntered(''); }}>
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
