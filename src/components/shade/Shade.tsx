import { useRef, type PointerEvent as RPointerEvent } from 'react';
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
import { Slider } from '../ui';
import { useNow, formatTime, haptic } from '../../os/hooks';
import { useState } from 'react';
import './Shade.css';

interface TileDef {
  key: string;
  label: string;
  Icon: typeof Wifi;
  on: (s: ReturnType<typeof useOS.getState>['system']) => boolean;
  sub?: (s: ReturnType<typeof useOS.getState>['system']) => string;
  toggle: () => void;
  settingsRoute?: string;
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

  const tiles: TileDef[] = [
    {
      key: 'wifi',
      label: 'Wi-Fi',
      Icon: Wifi,
      on: (s) => s.wifi,
      sub: (s) => (s.wifi ? s.wifiNetwork : 'Off'),
      toggle: () => patch({ wifi: !sys.wifi }),
      settingsRoute: 'network',
    },
    {
      key: 'bt',
      label: 'Bluetooth',
      Icon: Bluetooth,
      on: (s) => s.bluetooth,
      sub: (s) => (s.bluetooth ? 'On' : 'Off'),
      toggle: () => patch({ bluetooth: !sys.bluetooth }),
      settingsRoute: 'connected',
    },
    {
      key: 'airplane',
      label: 'Airplane',
      Icon: Plane,
      on: (s) => s.airplane,
      toggle: () => patch({ airplane: !sys.airplane, wifi: sys.airplane, bluetooth: !sys.airplane ? false : sys.bluetooth }),
      settingsRoute: 'network',
    },
    {
      key: 'flash',
      label: 'Flashlight',
      Icon: Flashlight,
      on: (s) => s.flashlight,
      toggle: () => patch({ flashlight: !sys.flashlight }),
    },
    {
      key: 'dnd',
      label: 'Do Not Disturb',
      Icon: Moon,
      on: (s) => s.dnd,
      toggle: () => patch({ dnd: !sys.dnd }),
      settingsRoute: 'sound',
    },
    {
      key: 'saver',
      label: 'Battery Saver',
      Icon: Leaf,
      on: (s) => s.batterySaver,
      toggle: () => patch({ batterySaver: !sys.batterySaver }),
      settingsRoute: 'battery',
    },
    {
      key: 'rotate',
      label: 'Auto-rotate',
      Icon: RotateCw,
      on: (s) => s.autoRotate,
      toggle: () => patch({ autoRotate: !sys.autoRotate }),
      settingsRoute: 'display',
    },
    {
      key: 'hotspot',
      label: 'Hotspot',
      Icon: Radio,
      on: (s) => s.hotspot,
      sub: (s) => (s.hotspot ? 'Active' : 'Off'),
      toggle: () => patch({ hotspot: !sys.hotspot }),
      settingsRoute: 'network',
    },
    {
      key: 'mobile',
      label: 'Mobile data',
      Icon: Signal,
      on: (s) => s.mobileData && !s.airplane,
      toggle: () => patch({ mobileData: !sys.mobileData }),
      settingsRoute: 'network',
    },
  ];

  const longPress = (route?: string) => (e: RPointerEvent) => {
    longTimer.current = setTimeout(() => {
      haptic(18);
      longTimer.current = null;
      if (route) {
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
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className={`qs-grid ${mode === 'qs' ? 'expanded' : ''}`}>
              {(mode === 'qs' ? tiles : tiles.slice(0, 6)).map((t) => (
                <button
                  key={t.key}
                  className={`qs-tile ${t.on(sys) ? 'on' : ''}`}
                  onPointerDown={longPress(t.settingsRoute)}
                  onPointerUp={cancelLong}
                  onPointerLeave={cancelLong}
                  onClick={() => {
                    haptic(10);
                    t.toggle();
                  }}
                >
                  <t.Icon size={18} />
                  <span className="qs-label">{t.label}</span>
                  {t.sub && <small>{t.sub(sys)}</small>}
                </button>
              ))}
            </div>

            <button className="qs-expand" onClick={() => setShade(mode === 'qs' ? 'notifications' : 'qs')}>
              {mode === 'qs' ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              {mode === 'qs' ? 'Collapse' : 'Expand'}
            </button>

            <div className="qs-sliders">
              <div className="qs-slider-row">
                <Sun size={16} />
                <Slider value={sys.brightness} onChange={(v) => patch({ brightness: v })} label="Brightness" />
                <span className="qs-pct">{sys.brightness}%</span>
              </div>
              <div className="qs-slider-row">
                <Volume2 size={16} />
                <Slider value={sys.mediaVol} onChange={(v) => patch({ mediaVol: v })} label="Volume" />
                <span className="qs-pct">{sys.mediaVol}%</span>
              </div>
            </div>

            {/* Simulated media player */}
            <div className="media-card">
              <div className="media-art dot-matrix" />
              <div className="media-meta">
                <strong>Glyph Demo — Synthwave</strong>
                <small>Nothing Sounds · simulated</small>
                <div className="media-controls">
                  <button aria-label="Previous"><SkipBack size={17} /></button>
                  <button
                    className="media-play"
                    aria-label={playing ? 'Pause' : 'Play'}
                    onClick={() => {
                      setPlaying(!playing);
                      if (!playing) patch({ glyphEffect: 'meter' });
                    }}
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button aria-label="Next"><SkipForward size={17} /></button>
                </div>
              </div>
            </div>

            <div className="shade-notifs app-scroll">
              <div className="shade-notifs-head">
                <strong>Notifications</strong>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="shade-clear">
                    <Trash2 size={13} /> Clear all
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
                      exit={{ opacity: 0, x: -80 }}
                      onClick={() => {
                        dismiss(n.id);
                        setShade('closed');
                        openApp(n.appId);
                      }}
                    >
                      <span className="icon-tile" style={{ width: 36, height: 36, background: app.tile }}>
                        <app.Icon size={20} />
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
                        <X size={14} />
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
