import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Timer, Bell, Clock3, ChevronRight } from 'lucide-react';
import { useOS } from '../../os/store';
import { useNow, formatTime } from '../../os/hooks';
import { playGlyphOn, playGlyphOff } from '../../os/sound';
import { Sheet, Slider } from '../ui';
import type { GlyphEffect } from '../../os/types';
import './BackView.css';

const EFFECTS: { id: GlyphEffect; name: string }[] = [
  { id: 'pulse', name: 'Pulse' },
  { id: 'wave', name: 'Wave' },
  { id: 'ripple', name: 'Ripple' },
  { id: 'meter', name: 'Volume meter' },
  { id: 'matrix', name: 'Matrix rain' },
  { id: 'off', name: 'Off' },
];

export default function BackView() {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const pushNotification = useOS((s) => s.pushNotification);
  const showToast = useOS((s) => s.showToast);
  const [sheet, setSheet] = useState(false);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const now = useNow(1000);

  useEffect(() => {
    if (sys.glyphTimer == null) {
      setTimerLeft(null);
      return;
    }
    setTimerLeft(sys.glyphTimer * 60);
    patch({ glyphTimer: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys.glyphTimer]);

  useEffect(() => {
    if (timerLeft == null) return;
    if (timerLeft <= 0) {
      setTimerLeft(null);
      pushNotification({ appId: 'clock', title: 'Glyph Timer', text: 'Time is up — Glyph Timer finished.' });
      showToast('Glyph Timer finished');
      return;
    }
    const t = setTimeout(() => setTimerLeft((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [timerLeft, pushNotification, showToast]);

  const active = sys.glyphEnabled && sys.glyphEffect !== 'off';
  const intensity = sys.glyphIntensity / 100;

  // Sound design: LEDs "powering up/down" when the rear view opens or the
  // Glyph / torch state changes while it is visible. The previous-state ref
  // also makes this immune to StrictMode's double effect invocation.
  const prevGlyph = useRef<{ view: boolean; active: boolean; torch: boolean } | null>(null);
  useEffect(() => {
    const prev = prevGlyph.current;
    if (!prev) {
      prevGlyph.current = { view: sys.showBackView, active, torch: sys.flashlight };
      return;
    }
    if (sys.showBackView && !prev.view) {
      if (active || sys.flashlight) playGlyphOn();
    } else if (sys.showBackView && prev.view) {
      if (active && !prev.active) playGlyphOn();
      else if (!active && prev.active && !sys.flashlight) playGlyphOff();
      if (sys.flashlight !== prev.torch) {
        if (sys.flashlight) playGlyphOn();
        else if (!active) playGlyphOff();
      }
    }
    prevGlyph.current = { view: sys.showBackView, active, torch: sys.flashlight };
  });

  return (
    <AnimatePresence>
      {sys.showBackView && (
        <motion.div
          className="back-view"
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
        >
          <div className="back-shell">
            <button className="back-close" onClick={() => patch({ showBackView: false })} aria-label="Front view">
              <X size={18} />
            </button>

            {/* Camera island — horizontal pill with twin lenses, like Phone (3) */}
            <div className="camera-island">
              <div className={`cam-ring ${active ? 'lit' : ''}`} style={{ opacity: active ? 0.4 + intensity * 0.6 : 0.28 }}>
                <div className="cam-lens" />
              </div>
              <div className={`cam-ring ${active ? 'lit' : ''}`} style={{ opacity: active ? 0.4 + intensity * 0.6 : 0.28 }}>
                <div className="cam-lens" />
              </div>
              <div className="cam-flash" style={{ opacity: sys.flashlight ? 1 : 0.22 }} />
            </div>

            {/* LED strips */}
            <div className={`glyph-strip top ${active ? `fx-${sys.glyphEffect}` : ''}`} style={{ opacity: active ? intensity : 0.08 }} />
            <div className={`glyph-strip side ${active ? `fx-${sys.glyphEffect}` : ''}`} style={{ opacity: active ? intensity : 0.08 }} />

            {/* Glyph Matrix */}
            <div className={`glyph-matrix fx-${active ? sys.glyphEffect : 'off'}`} style={{ ['--intensity' as string]: intensity }}>
              {Array.from({ length: 12 * 7 }).map((_, i) => (
                <span
                  key={i}
                  className="glyph-dot"
                  style={{
                    animationDelay: `${((i % 12) * 90 + Math.floor(i / 12) * 130) % 2200}ms`,
                    height: sys.glyphEffect === 'meter' ? `${20 + ((i * 37 + sys.mediaVol) % 80)}%` : undefined,
                  }}
                />
              ))}
            </div>

            {/* Overlay info */}
            {(sys.glyphClock || timerLeft != null) && (
              <div className="glyph-overlay-info">
                {timerLeft != null ? (
                  <>
                    <Timer size={16} />
                    <strong>
                      {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:
                      {String(timerLeft % 60).padStart(2, '0')}
                    </strong>
                  </>
                ) : (
                  <>
                    <Clock3 size={16} />
                    <strong>{formatTime(now)}</strong>
                  </>
                )}
              </div>
            )}

            <p className="back-caption">Glyph Matrix · simulated LED display</p>

            <div className="back-controls">
              <button className="n-btn" onClick={() => setSheet(true)}>
                Glyph settings <ChevronRight size={15} />
              </button>
              <button
                className="n-btn"
                onClick={() =>
                  pushNotification({
                    appId: 'messages',
                    title: 'Glyph test',
                    text: 'A simulated notification to preview Glyph patterns.',
                  })
                }
              >
                <Bell size={15} /> Test notification
              </button>
            </div>
          </div>

          <Sheet open={sheet} onClose={() => setSheet(false)} title="Glyph Interface">
            <div className="n-list-group">
              <div className="n-list-row">
                <span className="row-text">
                  <span>Glyph Interface</span>
                  <small>Master switch for the rear LED display</small>
                </span>
                <button
                  className={`n-switch ${sys.glyphEnabled ? 'on' : ''}`}
                  onClick={() => patch({ glyphEnabled: !sys.glyphEnabled })}
                />
              </div>
              <div className="n-list-row">
                <span className="row-text">
                  <span>Glyph clock</span>
                  <small>Show time on the matrix</small>
                </span>
                <button
                  className={`n-switch ${sys.glyphClock ? 'on' : ''}`}
                  onClick={() => patch({ glyphClock: !sys.glyphClock })}
                />
              </div>
            </div>

            <p className="n-section-title">Effect</p>
            <div className="glyph-effect-grid">
              {EFFECTS.map((e) => (
                <button
                  key={e.id}
                  className={`chip ${sys.glyphEffect === e.id ? 'active' : ''}`}
                  onClick={() => patch({ glyphEffect: e.id })}
                >
                  {e.name}
                </button>
              ))}
            </div>

            <p className="n-section-title">Intensity · {sys.glyphIntensity}%</p>
            <Slider value={sys.glyphIntensity} onChange={(v) => patch({ glyphIntensity: v })} />

            <p className="n-section-title">Glyph Timer</p>
            <div className="glyph-timer-row">
              {[5, 10, 25, 60].map((m) => (
                <button key={m} className="chip" onClick={() => patch({ glyphTimer: m })}>
                  {m} min
                </button>
              ))}
              {timerLeft != null && (
                <button className="chip active" onClick={() => setTimerLeft(null)}>
                  Stop {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:
                  {String(timerLeft % 60).padStart(2, '0')}
                </button>
              )}
            </div>
            <p className="glyph-note">
              This is a graphical simulation. A web page cannot control the real LEDs or physical
              buttons of a Nothing Phone.
            </p>
          </Sheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
