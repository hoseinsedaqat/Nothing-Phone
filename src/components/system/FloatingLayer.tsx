import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import { BackContext } from '../../os/back';
import './FloatingLayer.css';

export default function FloatingLayer() {
  const floating = useOS((s) => s.floating);
  const closeFloating = useOS((s) => s.closeFloating);
  const updateFloating = useOS((s) => s.updateFloating);
  const focusFloating = useOS((s) => s.focusFloating);
  const openApp = useOS((s) => s.openApp);

  return (
    <AnimatePresence>
      {floating.map((fw) => (
        <FloatingCard
          key={fw.id}
          fw={fw}
          onClose={() => closeFloating(fw.id)}
          onFocus={() => focusFloating(fw.id)}
          onUpdate={(patch) => updateFloating(fw.id, patch)}
          onExpand={() => {
            closeFloating(fw.id);
            openApp(fw.appId);
          }}
        />
      ))}
    </AnimatePresence>
  );
}

function FloatingCard({
  fw,
  onClose,
  onFocus,
  onUpdate,
  onExpand,
}: {
  fw: ReturnType<typeof useOS.getState>['floating'][number];
  onClose: () => void;
  onFocus: () => void;
  onUpdate: (patch: Partial<typeof fw>) => void;
  onExpand: () => void;
}) {
  const app = getApp(fw.appId);
  const handlerRef = useRef<(() => boolean) | null>(null);
  const App = app.Component;

  useEffect(() => {
    const onBack = () => {
      const st = useOS.getState();
      if (st.shadeMode !== 'closed' || st.drawerOpen || st.recentsOpen || st.searchOpen) return;
      if (handlerRef.current?.()) return;
      onClose();
    };
    window.addEventListener('os-back', onBack);
    return () => window.removeEventListener('os-back', onBack);
  }, [onClose]);

  return (
    <motion.div
      className="floating-card"
      style={{ left: fw.x, top: fw.y, width: fw.w, height: fw.h, zIndex: 200 + fw.z }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      onPointerDown={onFocus}
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const rect = document.querySelector('.phone-screen')?.getBoundingClientRect();
        const scale = rect ? rect.width / 393 : 1;
        onUpdate({
          x: Math.min(393 - 90, Math.max(0, fw.x + info.offset.x / scale)),
          y: Math.min(852 - 120, Math.max(44, fw.y + info.offset.y / scale)),
        });
      }}
    >
      <div className="floating-titlebar" onPointerDown={(e) => e.stopPropagation()}>
        <span className="floating-title">
          <span className="icon-tile" style={{ width: 22, height: 22, background: app.tile }}>
            <app.Icon size={13} />
          </span>
          {app.name}
        </span>
        <div className="floating-actions">
          <button aria-label="Expand" onClick={onExpand}>
            <Maximize2 size={13} />
          </button>
          <button aria-label="Close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="floating-body">
        <BackContext.Provider value={{ register: (h) => (handlerRef.current = h) }}>
          <App />
        </BackContext.Provider>
      </div>
      <div
        className="floating-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = fw.w;
          const startH = fw.h;
          const move = (ev: PointerEvent) => {
            const rect = document.querySelector('.phone-screen')?.getBoundingClientRect();
            const scale = rect ? rect.width / 393 : 1;
            onUpdate({
              w: Math.min(360, Math.max(220, startW + (ev.clientX - startX) / scale)),
              h: Math.min(640, Math.max(300, startH + (ev.clientY - startY) / scale)),
            });
          };
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
      >
        <Minus size={12} />
      </div>
    </motion.div>
  );
}
