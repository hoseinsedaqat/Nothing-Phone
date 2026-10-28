import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import './Recents.css';

export default function Recents() {
  const open = useOS((s) => s.recentsOpen);
  const setOpen = useOS((s) => s.setRecents);
  const recents = useOS((s) => s.recents);
  const openApp = useOS((s) => s.openApp);
  const removeRecent = useOS((s) => s.removeRecent);
  const clearRecents = useOS((s) => s.clearRecents);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="recents-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="recents-head">
            <strong>Recent apps</strong>
            {recents.length > 0 && (
              <button className="recents-clear" onClick={clearRecents}>
                <Trash2 size={14} /> Clear all
              </button>
            )}
          </div>

          {recents.length === 0 ? (
            <div className="recents-empty">
              <p>No recent apps</p>
              <small>Open an app and it will show up here</small>
            </div>
          ) : (
            <div className="recents-list app-scroll">
              {recents.map((appId, i) => {
                const app = getApp(appId);
                const App = app.Component;
                return (
                  <motion.div
                    key={appId}
                    className="recent-card"
                    initial={{ opacity: 0, y: 40, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -120 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      setOpen(false);
                      openApp(appId);
                    }}
                  >
                    <div className="recent-preview">
                      {appId === 'camera' || appId === 'chrome' ? (
                        <div className="recent-placeholder">
                          <span className="icon-tile" style={{ width: 58, height: 58, background: app.tile }}>
                            <app.Icon size={32} />
                          </span>
                          <strong>{app.name}</strong>
                          <small>Live preview paused</small>
                        </div>
                      ) : (
                        <div className="recent-preview-inner">
                          <App />
                        </div>
                      )}
                    </div>
                    <div className="recent-meta">
                      <span className="icon-tile" style={{ width: 26, height: 26, background: app.tile }}>
                        <app.Icon size={15} />
                      </span>
                      <span>{app.name}</span>
                      <button
                        className="recent-x"
                        aria-label={`Close ${app.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(appId);
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          <button className="recents-home" onClick={() => setOpen(false)}>
            Back to home
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
