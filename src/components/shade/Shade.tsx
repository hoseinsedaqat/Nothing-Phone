import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Wifi,
  Bluetooth,
  Plane,
  Flashlight,
  Moon,
  Leaf,
  RotateCw,
  Radio,
  Signal,
  Sun,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import { useNow, formatTime, haptic } from '../../os/hooks';
import './Shade.css';

interface TileDef {
  key: string;
  label: string;
  Icon: typeof Wifi;
  on: boolean;
  sub?: string;
  toggle: () => void;
  settingsRoute?: string;
}

/** Full-width pill slider — identical component for brightness and volume. */
function PillSlider({
  value,
  onChange,
  Icon,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  Icon: typeof Sun;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setFromEvent = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    onChange(Math.round(pct));
  };
  const onPointerDown = (e: RPointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromEvent(e.clientX);
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (e.buttons !== 1) return;
    setFromEvent(e.clientX);
  };
  return (
    <div
      ref={ref}
      className="pill-slider"
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <div className="pill-slider-fill" style={{ width: `${value}%` }} />
      <span className="pill-slider-icon" style={{ color: value > 14 ? '#111' : '#f5f5f7' }}>
        <Icon size={16} />
      </span>
      <span className="pill-slider-pct">{value}%</span>
    </div>
  );
}

export default function Shade() {
  const mode = useOS((s) => s.shadeMode);
  const setShade = useOS((s) => s.setShade);
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const notifications = useOS((s) => s.notifications);
  const dismiss = useOS((s) => s.dismissNotification);
  const clearAll = useOS((s) => s.clearNotifications);
  const openApp = useOS((s) => s.openApp);
  const [playing, setPlaying] = useState(false);
  const now = useNow(30_000);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTiles: TileDef[] = [
    { key: 'wifi', label: 'Wi-Fi', Icon: Wifi, on: sys.wifi, sub: sys.wifi ? sys.wifiNetwork : 'Off',
      toggle: () => patch({ wifi: !sys.wifi }), settingsRoute: 'network' },
    { key: 'bt', label: 'Bluetooth', Icon: Bluetooth, on: sys.bluetooth, sub: sys.bluetooth ? 'On' : 'Off',
      toggle: () => patch({ bluetooth: !sys.bluetooth }), settingsRoute: 'connected' },
    { key: 'airplane', label: 'Airplane', Icon: Plane, on: sys.airplane,
      toggle: () => patch({ airplane: !sys.airplane, wifi: sys.airplane, bluetooth: !sys.airplane ? false : sys.bluetooth }),
      settingsRoute: 'network' },
    { key: 'flash', label: 'Torch', Icon: Flashlight, on: sys.flashlight,
      toggle: () => patch({ flashlight: !sys.flashlight }) },
    { key: 'dnd', label: 'DND', Icon: Moon, on: sys.dnd,
      toggle: () => patch({ dnd: !sys.dnd }), settingsRoute: 'sound' },
    { key: 'saver', label: 'Saver', Icon: Leaf, on: sys.batterySaver,
      toggle: () => patch({ batterySaver: !sys.batterySaver }), settingsRoute: 'battery' },
    { key: 'rotate', label: 'Rotate', Icon: RotateCw, on: sys.autoRotate,
      toggle: () => patch({ autoRotate: !sys.autoRotate }), settingsRoute: 'display' },
    { key: 'mobile', label: 'Mobile', Icon: Signal, on: sys.mobileData && !sys.airplane,
      toggle: () => patch({ mobileData: !sys.mobileData }), settingsRoute: 'network' },
    { key: 'hotspot', label: 'Hotspot', Icon: Radio, on: sys.hotspot,
      toggle: () => patch({ hotspot: !sys.hotspot }), settingsRoute: 'network' },
  ];
  const tiles = mode === 'qs' ? allTiles : allTiles.slice(0, 8);

  const longFired = useRef(false);
  const longPress = (route?: string) => () => {
    longFired.current = false;
    longTimer.current = setTimeout(() => {
      haptic(18);
      longTimer.current = null;
      if (route) {
        longFired.current = true;
        setShade('closed');
        openApp('settings');
        window.dispatchEvent(new CustomEvent('os-open-settings', { detail: route }));
      }
    }, 450);
  };
  const cancelLong = () => {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };

  return (
    <AnimatePresence>
      {mode !== 'closed' && (
        <motion.div
          className="shade-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShade('closed')}
        >
          <motion.div
            className="shade"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shade-grabber" />
            <div className="shade-head">
              <span className="shade-time">{formatTime(now)}</span>
              <button
                className="shade-gear"
                onClick={() => {
                  setShade('closed');
                  openApp('settings');
                }}
                aria-label="Settings"
              >
                <SettingsIcon size={18} />
              </button>
            </div>

            {/* Circular quick toggles — Nothing style */}
            <div className="qs-circles">
              {tiles.map((t) => (
                <button
                  key={t.key}
                  className={`qs-circle ${t.on ? 'on' : ''}`}
                  onPointerDown={longPress(t.settingsRoute)}
                  onPointerUp={cancelLong}
                  onPointerLeave={cancelLong}
                  onClick={() => {
                    if (longFired.current) return;
                    haptic(9);
                    t.toggle();
                  }}
                  aria-label={t.label}
                >
                  <span className="qs-circle-icon">
                    <t.Icon size={19} />
                  </span>
                  <span className="qs-circle-label">{t.label}</span>
                  {t.sub && <small>{t.sub}</small>}
                </button>
              ))}
            </div>

            <button className="qs-expand" onClick={() => setShade(mode === 'qs' ? 'notifications' : 'qs')}>
              {mode === 'qs' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {mode === 'qs' ? 'Show less' : 'Show all controls'}
            </button>

            {/* Coordinated pill sliders */}
            <div className="qs-sliders">
              <PillSlider value={sys.brightness} onChange={(v) => patch({ brightness: v })} Icon={Sun} label="Brightness" />
              <PillSlider value={sys.mediaVol} onChange={(v) => patch({ mediaVol: v })} Icon={Volume2} label="Volume" />
            </div>

            {/* Media player */}
            <div className="media-card">
              <div className="media-art dot-matrix" />
              <div className="media-meta">
                <strong>Glyph Demo — Synthwave</strong>
                <small>Nothing Sounds · simulated</small>
                <div className="media-controls">
                  <button aria-label="Previous"><SkipBack size={16} /></button>
                  <button
                    className="media-play"
                    aria-label={playing ? 'Pause' : 'Play'}
                    onClick={() => {
                      setPlaying(!playing);
                      if (!playing) patch({ glyphEffect: 'meter' });
                    }}
                  >
                    {playing ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <button aria-label="Next"><SkipForward size={16} /></button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="shade-notifs app-scroll">
              <div className="shade-notifs-head">
                <strong>Notifications</strong>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="shade-clear">
                    <Trash2 size={12} /> Clear all
                  </button>
                )}
              </div>
              {notifications.length === 0 && <p className="shade-empty">No active notifications</p>}
              <AnimatePresence>
                {notifications.map((n) => {
                  const app = getApp(n.appId);
                  return (
                    <motion.div
                      key={n.id}
                      className="shade-notif"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -70 }}
                      onClick={() => {
                        dismiss(n.id);
                        setShade('closed');
                        openApp(n.appId);
                      }}
                    >
                      <span className="shade-notif-dot" style={{ background: app.tile === '#ffffff' ? '#D71921' : app.tile }} />
                      <span className="icon-tile" style={{ width: 34, height: 34, background: app.tile }}>
                        <app.Icon size={18} />
                      </span>
                      <div className="shade-notif-text">
                        <div>
                          <strong>{n.title}</strong>
                          <time>{formatTime(new Date(n.time))}</time>
                        </div>
                        <p>{n.text}</p>
                      </div>
                      <button
                        className="shade-notif-x"
                        aria-label="Dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(n.id);
                        }}
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
