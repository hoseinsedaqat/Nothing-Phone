import type { FC, ReactNode } from 'react';
import { ChevronRight, ChevronLeft, X, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { haptic } from '../os/hooks';
import './ui.css';

// ── App chrome (shared header / body / FAB) ─────────────────
export const AppChrome: FC<{
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  headerTransparent?: boolean;
}> = ({ title, onBack, actions, children, headerTransparent }) => (
  <div className="app-chrome">
    <header className={`app-header ${headerTransparent ? 'transparent' : ''}`}>
      {onBack && (
        <button
          className="app-header-btn"
          aria-label="Back"
          onClick={() => {
            haptic(8);
            onBack();
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <h1>{title}</h1>
      <div className="app-header-actions">{actions}</div>
    </header>
    <div className="app-body app-scroll">{children}</div>
  </div>
);

export const Switch: FC<{ on: boolean; onChange: (v: boolean) => void; label?: string }> = ({
  on,
  onChange,
  label,
}) => (
  <button
    className={`n-switch ${on ? 'on' : ''}`}
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      haptic(10);
      onChange(!on);
    }}
  />
);

export const Slider: FC<{
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
}> = ({ value, min = 0, max = 100, step = 1, onChange, label }) => (
  <input
    className="n-slider"
    type="range"
    aria-label={label}
    min={min}
    max={max}
    step={step}
    value={value}
    style={{ ['--fill' as string]: `${((value - min) / (max - min)) * 100}%` }}
    onChange={(e) => onChange(Number(e.target.value))}
  />
);

export const Segmented: FC<{
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="segmented">
    {options.map((o) => (
      <button
        key={o.id}
        className={value === o.id ? 'active' : ''}
        onClick={() => {
          haptic(8);
          onChange(o.id);
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Row: FC<{
  icon?: ReactNode;
  label: string;
  sub?: string;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, label, sub, right, onClick, danger }) => (
  <button className="n-list-row" onClick={onClick} disabled={!onClick && !right}>
    {icon && <span className="row-icon">{icon}</span>}
    <span className="row-text">
      <span className={danger ? 'danger-text' : ''}>{label}</span>
      {sub && <small>{sub}</small>}
    </span>
    {right ?? (onClick ? <ChevronRight size={18} className="row-chevron" /> : null)}
  </button>
);

export const EmptyState: FC<{ icon: ReactNode; title: string; text: string; action?: ReactNode }> = ({
  icon,
  title,
  text,
  action,
}) => (
  <div className="empty-state">
    <span className="empty-icon">{icon}</span>
    <strong>{title}</strong>
    <p>{text}</p>
    {action}
  </div>
);

// ── Bottom sheet ─────────────────────────────────────────────
export const Sheet: FC<{ open: boolean; onClose: () => void; title?: string; children: ReactNode }> = ({
  open,
  onClose,
  title,
  children,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="sheet-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sheet-grabber" />
          {title && (
            <div className="sheet-title">
              <h2>{title}</h2>
              <button className="app-header-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
          )}
          <div className="sheet-body app-scroll">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Confirmation dialog ──────────────────────────────────────
export const ConfirmDialog: FC<{
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, text, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="dialog-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="dialog"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {danger && <AlertTriangle size={26} color="#ff453a" />}
          <h3>{title}</h3>
          <p>{text}</p>
          <div className="dialog-actions">
            <button className="n-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className={`n-btn ${danger ? 'danger' : 'accent'}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
