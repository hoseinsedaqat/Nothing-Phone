import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getApp } from '../../os/registry';
import { useOS } from '../../os/store';
import { BackContext } from '../../os/back';
import './AppWindow.css';

export default function AppWindow({ appId }: { appId: string }) {
  const app = getApp(appId);
  const goHome = useOS((s) => s.goHome);
  const handlerRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    const onBack = () => {
      const st = useOS.getState();
      if (st.shadeMode !== 'closed' || st.drawerOpen || st.recentsOpen || st.searchOpen) return;
      if (handlerRef.current?.()) return;
      goHome();
    };
    window.addEventListener('os-back', onBack);
    return () => window.removeEventListener('os-back', onBack);
  }, [goHome]);

  const App = app.Component;

  return (
    <BackContext.Provider value={{ register: (h) => (handlerRef.current = h) }}>
      <motion.div
        className="app-window"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
      >
        <App />
      </motion.div>
    </BackContext.Provider>
  );
}
