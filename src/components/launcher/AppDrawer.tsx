import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Pin, PinOff, EyeOff, Plus, Check, ArrowUpDown } from 'lucide-react';
import { useOS } from '../../os/store';
import { APP_REGISTRY } from '../../os/registry';
import AppIcon from '../AppIcon';
import { Sheet } from '../ui';
import { haptic } from '../../os/hooks';
import './AppDrawer.css';

export default function AppDrawer() {
  const open = useOS((s) => s.drawerOpen);
  const setOpen = useOS((s) => s.setDrawer);
  const launcher = useOS((s) => s.launcher);
  const patchLauncher = useOS((s) => s.patchLauncher);
  const addToHome = useOS((s) => s.addToHome);
  const openApp = useOS((s) => s.openApp);
  const [query, setQuery] = useState('');
  const [actionApp, setActionApp] = useState<string | null>(null);

  const visibleApps = useMemo(() => {
    let apps = APP_REGISTRY.filter((a) => !launcher.hidden.includes(a.id));
    if (launcher.drawerSort === 'custom' && launcher.customOrder.length) {
      apps = [...apps].sort(
        (a, b) => launcher.customOrder.indexOf(a.id) - launcher.customOrder.indexOf(b.id),
      );
    } else {
      apps = [...apps].sort((a, b) => a.name.localeCompare(b.name));
    }
    const q = query.trim().toLowerCase();
    if (q) apps = apps.filter((a) => a.name.toLowerCase().includes(q));
    // pinned first
    return [...apps].sort(
      (a, b) => Number(launcher.pinned.includes(b.id)) - Number(launcher.pinned.includes(a.id)),
    );
  }, [launcher, query]);

  const hiddenApps = APP_REGISTRY.filter((a) => launcher.hidden.includes(a.id));
  const onHome = (id: string) =>
    launcher.pages.some((p) => p.includes(id)) || launcher.dock.includes(id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer-scrim"
          className="drawer-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-handle" onClick={() => setOpen(false)} />
            <div className="drawer-search">
              <Search size={16} />
              <input
                autoFocus
                placeholder="Search apps"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="drawer-toolbar">
              <button
                className="chip"
                onClick={() =>
                  patchLauncher({ drawerSort: launcher.drawerSort === 'name' ? 'custom' : 'name' })
                }
              >
                <ArrowUpDown size={12} /> {launcher.drawerSort === 'name' ? 'A–Z' : 'Custom'}
              </button>
              <span className="drawer-count">{visibleApps.length} apps</span>
            </div>

            <div className="drawer-grid app-scroll">
              {visibleApps.map((app) => (
                <AppIcon
                  key={app.id}
                  appId={app.id}
                  onOpen={(id) => {
                    setOpen(false);
                    openApp(id);
                  }}
                  onLongPress={(id) => setActionApp(id)}
                />
              ))}
              {visibleApps.length === 0 && (
                <p className="drawer-empty">No apps match “{query}”.</p>
              )}
            </div>

            {hiddenApps.length > 0 && (
              <div className="drawer-hidden">
                <p className="n-section-title">
                  <EyeOff size={12} /> Hidden apps ({hiddenApps.length})
                </p>
                <div className="drawer-grid">
                  {hiddenApps.map((app) => (
                    <AppIcon
                      key={app.id}
                      appId={app.id}
                      onLongPress={(id) => setActionApp(id)}
                      onOpen={(id) => {
                        setOpen(false);
                        openApp(id);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <Sheet key="drawer-sheet" open={!!actionApp} onClose={() => setActionApp(null)}>
        {actionApp &&
          (() => {
            const app = APP_REGISTRY.find((a) => a.id === actionApp)!;
            const pinned = launcher.pinned.includes(app.id);
            const hidden = launcher.hidden.includes(app.id);
            return (
              <div className="icon-menu">
                <div className="icon-menu-head">
                  <span className="icon-tile" style={{ width: 52, height: 52, background: app.tile }}>
                    <app.Icon size={30} />
                  </span>
                  <div>
                    <strong>{app.name}</strong>
                    {app.limitation && <small>{app.limitation}</small>}
                  </div>
                </div>
                <button
                  className="sheet-action"
                  onClick={() => {
                    openApp(app.id);
                    setActionApp(null);
                    setOpen(false);
                  }}
                >
                  <Check size={17} /> Open app
                </button>
                <button
                  className="sheet-action"
                  disabled={onHome(app.id)}
                  onClick={() => {
                    addToHome(app.id);
                    haptic(10);
                    setActionApp(null);
                  }}
                >
                  <Plus size={17} /> {onHome(app.id) ? 'Already on home screen' : 'Add to home screen'}
                </button>
                <button
                  className="sheet-action"
                  onClick={() => {
                    patchLauncher({
                      pinned: pinned
                        ? launcher.pinned.filter((x) => x !== app.id)
                        : [...launcher.pinned, app.id],
                      customOrder: pinned
                        ? launcher.customOrder.filter((x) => x !== app.id)
                        : [app.id, ...launcher.customOrder.filter((x) => x !== app.id)],
                    });
                    setActionApp(null);
                  }}
                >
                  {pinned ? <PinOff size={17} /> : <Pin size={17} />}
                  {pinned ? 'Unpin app' : 'Pin to top'}
                </button>
                <button
                  className="sheet-action danger"
                  onClick={() => {
                    patchLauncher({
                      hidden: hidden
                        ? launcher.hidden.filter((x) => x !== app.id)
                        : [...launcher.hidden, app.id],
                    });
                    setActionApp(null);
                  }}
                >
                  <EyeOff size={17} /> {hidden ? 'Unhide app' : 'Hide app'}
                </button>
              </div>
            );
          })()}
      </Sheet>
    </AnimatePresence>
  );
}
