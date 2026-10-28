import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, FlipHorizontal2, Plus, Minus, Power, SlidersHorizontal } from 'lucide-react';
import { useOS } from '../os/store';
import { haptic } from '../os/hooks';
import {
  primeAudio,
  playUnlock,
  playLock,
  playNotification,
  playTick,
  playCharge,
  playUnplug,
} from '../os/sound';
import LockScreen from './lock/LockScreen';
import AODScreen from './lock/AODScreen';
import ChargingOverlay from './system/ChargingOverlay';
import HomeScreen from './launcher/HomeScreen';
import AppWindow from './system/AppWindow';
import FloatingLayer from './system/FloatingLayer';
import AppDrawer from './launcher/AppDrawer';
import Shade from './shade/Shade';
import Recents from './system/Recents';
import GlobalSearch from './system/GlobalSearch';
import BackView from './glyph/BackView';
import PinGate from './lock/PinGate';
import StatusBar from './StatusBar';
import NavBar from './NavBar';
import Toast from './system/Toast';
import BootScreen from './system/BootScreen';
import PowerMenu from './system/PowerMenu';
import './PhoneStage.css';

const W = 393;
const H = 852;

export default function PhoneStage() {
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const sys = useOS((s) => s.system);
  const powerState = sys.powerState;
  const activeAppId = useOS((s) => s.activeAppId);
  const setPower = useOS((s) => s.setPower);
  const setShade = useOS((s) => s.setShade);
  const setDrawer = useOS((s) => s.setDrawer);
  const goHome = useOS((s) => s.goHome);
  const [powerMenu, setPowerMenu] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifications = useOS((s) => s.notifications);

  // Unlock the Web Audio graph on the first gesture (autoplay policy).
  useEffect(() => {
    const prime = () => primeAudio();
    window.addEventListener('pointerdown', prime, { once: true });
    return () => window.removeEventListener('pointerdown', prime);
  }, []);

  // Lock / unlock sound effects on real power-state transitions.
  const prevPower = useRef(powerState);
  useEffect(() => {
    const prev = prevPower.current;
    if (prev !== powerState) {
      if (powerState === 'unlocked') playUnlock();
      else if (powerState === 'locked' && prev === 'unlocked') playLock();
      prevPower.current = powerState;
    }
  }, [powerState]);

  // Chime whenever a new notification arrives (DND/silent handled inside).
  const prevNotifCount = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > prevNotifCount.current) playNotification();
    prevNotifCount.current = notifications.length;
  }, [notifications]);

  // Responsive fit
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const f = Math.min((vw - 16) / W, (vh - 16) / H);
      setFit(vw < 520 ? Math.min(f, 1.12) : Math.min(f, 1));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Screen timeout -> AOD (if enabled) then lock; re-armed on interaction
  const [activity, setActivity] = useState(0);
  useEffect(() => {
    if (powerState !== 'unlocked') return;
    const t = setTimeout(
      () => setPower(useOS.getState().system.aodEnabled ? 'aod' : 'locked'),
      sys.screenTimeout * 1000,
    );
    return () => clearTimeout(t);
  }, [powerState, sys.screenTimeout, sys.aodEnabled, setPower, activity]);

  // Charging connect/disconnect: sound + transient overlay
  const [chargeFlash, setChargeFlash] = useState(false);
  const prevCharging = useRef(sys.charging);
  useEffect(() => {
    if (prevCharging.current === sys.charging) return;
    prevCharging.current = sys.charging;
    if (sys.charging) {
      playCharge();
      setChargeFlash(true);
      const t = setTimeout(() => setChargeFlash(false), 3200);
      return () => clearTimeout(t);
    }
    playUnplug();
  }, [sys.charging]);

  // Keyboard: Escape closes overlays first, otherwise acts as back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const st = useOS.getState();
      if (st.shadeMode !== 'closed') st.setShade('closed');
      else if (st.drawerOpen) st.setDrawer(false);
      else if (st.recentsOpen) st.setRecents(false);
      else if (st.searchOpen) st.setSearch(false);
      else window.dispatchEvent(new CustomEvent('os-back'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // os-exit-app -> home
  useEffect(() => {
    const h = () => goHome();
    window.addEventListener('os-exit-app', h);
    return () => window.removeEventListener('os-exit-app', h);
  }, [goHome]);

  // ── Pointer gestures (coordinates converted to logical 393×852) ──
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const toLocal = (clientX: number, clientY: number) => {
    const rect = screenRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };
  const onPointerDown = (e: RPointerEvent) => {
    setActivity((a) => a + 1);
    start.current = { ...toLocal(e.clientX, e.clientY), t: Date.now() };
  };
  const finishPointer = (e: RPointerEvent) => {
    if (!start.current) return;
    const end = toLocal(e.clientX, e.clientY);
    const dx = end.x - start.current.x;
    const dy = end.y - start.current.y;
    const { x, y } = start.current;
    start.current = null;
    const st = useOS.getState();
    if (st.system.powerState !== 'unlocked') return;
    // Edge back
    if ((x < 14 || x > W - 14) && Math.abs(dx) > 48 && Math.abs(dy) < 60) {
      haptic(10);
      window.dispatchEvent(new CustomEvent('os-back'));
      return;
    }
    // Pull down shade — forgiving trigger: starts anywhere in the top
    // ~11% of the screen, only 34px of downward travel needed, and vertical
    // motion must dominate so horizontal pager swipes never open it.
    if (y < 96 && dy > 34 && dy > Math.abs(dx) * 1.05) {
      haptic(12);
      setShade(dy > 150 ? 'qs' : 'notifications');
      return;
    }
    // Swipe up from bottom
    if (y > H - 30 && dy < -70) {
      haptic(12);
      if (st.activeAppId || st.floating.length) goHome();
      else setDrawer(true);
      return;
    }
  };

  const scale = fit * zoom;
  const dark = sys.darkMode;

  const pressPower = () => {
    pressTimer.current = setTimeout(() => {
      haptic([20, 40, 20]);
      setPowerMenu(true);
      pressTimer.current = null;
    }, 550);
  };
  const releasePower = () => {
    if (!pressTimer.current) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
    if (powerState === 'off') setPower('booting');
    else if (powerState === 'locked') setPower('locked');
    else setPower('locked');
  };

  return (
    <div className="stage" ref={stageRef}>
      <div
        className="phone-scaler"
        style={{ width: W * scale, height: H * scale }}
      >
        <div
          className="phone-frame"
          style={{ transform: `scale(${scale})`, width: W, height: H }}
          data-theme={dark ? 'dark' : 'light'}
          data-accent={sys.accent}
        >
          {/* Physical side buttons — Phone (3): volume rocker + power on the right */}
          <div className="side-btn side-volume-up" onClick={() => volumeKey('up')} />
          <div className="side-btn side-volume-down" onClick={() => volumeKey('down')} />
          <div
            className="side-btn side-power"
            onPointerDown={pressPower}
            onPointerUp={releasePower}
            onPointerLeave={releasePower}
          >
            <span className="power-accent" />
          </div>

          {/* Left edge hardware */}
          <div className="sim-tray" />
          <span className="antenna antenna-l-top" />
          <span className="antenna antenna-l-bottom" />
          <span className="antenna antenna-r-top" />
          <span className="antenna antenna-r-bottom" />

          {/* Top edge: IR blaster + microphone pinhole */}
          <span className="edge-ir" />
          <span className="edge-mic edge-mic-top" />

          {/* Bottom edge: speaker grilles, USB-C, microphone */}
          <span className="speaker-holes speaker-left" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => <i key={i} />)}
          </span>
          <span className="usb-c" />
          <span className="speaker-holes speaker-right" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => <i key={i} />)}
          </span>
          <span className="edge-mic edge-mic-bottom" />

          <div
            className="phone-screen"
            ref={screenRef}
            onPointerDown={onPointerDown}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
          >
            {/* punch-hole camera */}
            <div className="punch-hole" />
            {/* edge-back gesture zones */}
            <div className="gesture-edge left" />
            <div className="gesture-edge right" />
            {/*
              Touch-capture hot zones: touch-action:none stops the browser from
              hijacking vertical drags for app-content scrolling (which fired
              pointercancel and swallowed the shade/home gesture inside apps).
            */}
            <div className="gesture-hotzone top" style={{ touchAction: 'none' }} aria-hidden />
            <div className="gesture-hotzone bottom" style={{ touchAction: 'none' }} aria-hidden />
            {/* curved-glass reflection, purely decorative */}
            <div className="glass-sheen" aria-hidden />

            {sys.customWallpaper ? (
              <div className="wallpaper" style={{ backgroundImage: `url(${sys.customWallpaper})` }} />
            ) : (
              <div className={`wallpaper wp-${sys.wallpaper}`} />
            )}
            <div
              className="brightness-veil"
              style={{ opacity: ((100 - sys.brightness) / 100) * 0.72 }}
            />

            {powerState === 'unlocked' && (
              <>
                <HomeScreen />
                <AnimatePresence>{activeAppId && <AppWindow key={activeAppId} appId={activeAppId} />}</AnimatePresence>
                <FloatingLayer />
                <AppDrawer />
                <Recents />
                <GlobalSearch />
              </>
            )}

            {powerState === 'locked' && <LockScreen />}
            {powerState === 'aod' && <AODScreen />}
            {powerState === 'booting' && <BootScreen />}
            <ChargingOverlay show={chargeFlash} />
            {powerState === 'off' && (
              <div className="off-screen">
                <Power size={30} color="#444" />
              </div>
            )}

            <Shade />
            <BackView />
            <PinGate />
            {powerState !== 'aod' && powerState !== 'off' && <StatusBar />}
            {powerState === 'unlocked' && <NavBar />}
            <Toast />
            <PowerMenu open={powerMenu} onClose={() => setPowerMenu(false)} />
          </div>
        </div>
      </div>

      {/* Stage controls: full row on wide screens; collapsed behind a
          single toggle on phones where the frame fills the viewport. */}
      <div className={`stage-controls ${controlsOpen ? 'open' : ''}`}>
        <button
          className="stage-controls-toggle"
          aria-label="Stage controls"
          aria-expanded={controlsOpen}
          onClick={() => setControlsOpen((v) => !v)}
        >
          <SlidersHorizontal size={16} />
        </button>
        <div className="stage-controls-panel" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) setControlsOpen(false); }}>
          <button onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2)))} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <button onClick={() => setZoom(1)} aria-label="Reset zoom">
            <RotateCcw size={15} />
          </button>
          <button onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))} aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <button
            onClick={() => useOS.getState().patchSystem({ showBackView: !sys.showBackView })}
            aria-label={sys.showBackView ? 'Front view' : 'Flip phone'}
            className={sys.showBackView ? 'active' : ''}
          >
            <FlipHorizontal2 size={16} />
          </button>
        </div>
      </div>
      <p className="stage-hint">
        Nothing Phone (3) simulator · drag from top for notifications · swipe up for home/drawer ·
        edges to go back · Esc = back
      </p>
    </div>
  );
}

function volumeKey(dir: 'up' | 'down') {
  const s = useOS.getState();
  const next = Math.min(100, Math.max(0, s.system.mediaVol + (dir === 'up' ? 8 : -8)));
  s.patchSystem({ mediaVol: next });
  s.showToast(`Media volume ${next}%`);
  playTick();
}
