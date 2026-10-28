import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useOS } from '../../os/store';
import './ChargingOverlay.css';

/**
 * Transient charging animation: green ring + percentage, shown briefly
 * when the (simulated) charger connects. Non-blocking — pointer events
 * pass through to whatever is underneath.
 */
export default function ChargingOverlay({ show }: { show: boolean }) {
  const batteryLevel = useOS((s) => s.system.batteryLevel);
  const R = 74;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="charging-overlay"
          style={{ pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="charging-card">
            <svg viewBox="0 0 180 180" className="charging-ring">
              <circle cx="90" cy="90" r={R} className="ring-track" />
              <motion.circle
                cx="90"
                cy="90"
                r={R}
                className="ring-fill"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - batteryLevel / 100) }}
                transition={{ duration: 1.1, ease: [0.2, 0, 0, 1] }}
              />
            </svg>
            <div className="charging-center">
              <span className="charging-bolt">
                <Zap size={26} fill="currentColor" />
              </span>
              <strong>{batteryLevel}%</strong>
              <small>Charging</small>
            </div>
            <div className="charging-glyph" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
              ))}
            </div>
            <p className="charging-note">Simulated charger · no real power delivery</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
