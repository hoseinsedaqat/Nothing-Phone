import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Copy, Trash2, AppWindow, Pencil, Image as ImageIcon, Check } from 'lucide-react';
import { useOS } from '../../os/store';
import { getApp } from '../../os/registry';
import AppIcon from '../AppIcon';
import { WIDGETS } from './Widgets';
import { Sheet } from '../ui';
import { haptic } from '../../os/hooks';
import './HomeScreen.css';

interface DragState {
  appId: string;
  fromPage: number;
  fromIdx: number;
  x: number;
  y: number;
}

export default function HomeScreen() {
  const launcher = useOS((s) => s.launcher);
  const iconSize = useOS((s) => s.system.iconSize);
  const patchLauncher = useOS((s) => s.patchLauncher);
  const moveIcon = useOS((s) => s.moveIcon);
  const removeFromHome = useOS((s) => s.removeFromHome);
  const addPage = useOS((s) => s.addPage);
  const openApp = useOS((s) => s.openApp);
  const openFloating = useOS((s) => s.openFloating);
  const setSearch = useOS((s) => s.setSearch);
  const patchSystem = useOS((s) => s.patchSystem);

  const [page, setPage] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [menuAppId, setMenuAppId] = useState<string | null>(null);
  const [editSheet, setEditSheet] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLDivElement>(null);

  const toLocal = (e: RPointerEvent | PointerEvent) => {
    const rect = screenRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 393,
      y: ((e.clientY - rect.top) / rect.height) * 852,
    };
  };

  const startDrag = (appId: string, fromPage: number, fromIdx: number) => (e: RPointerEvent) => {
    if (!editMode) return;
    const p = toLocal(e);
    setDrag({ appId, fromPage, fromIdx, x: p.x, y: p.y });
    const move = (ev: PointerEvent) => {
      const lp = toLocal(ev);
      setDrag((d) => (d ? { ...d, x: lp.x, y: lp.y } : d));
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const slot = target?.closest('[data-slot]') as HTMLElement | null;
      setDropHint(slot?.dataset.slot ?? null);
    };
    const up = (ev: PointerEvent) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const slot = (target?.closest('[data-slot]') as HTMLElement | null)?.dataset.slot;
      if (slot) {
        const [tp, ti] = slot.split('-').map(Number);
        if (tp !== fromPage || ti !== fromIdx) {
          moveIcon(fromPage, fromIdx, tp, ti);
          haptic(15);
        }
      }
      setDrag(null);
      setDropHint(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onScroll = () => {
    const el = pagerRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  const menuApp = menuAppId ? getApp(menuAppId) : null;
  const bgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBgDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest('.app-icon-wrap, .widget, button, .search-pill, .dock')) return;
    bgTimer.current = setTimeout(() => {
      haptic(20);
      setEditSheet(true);
      bgTimer.current = null;
    }, 500);
  };
  const onBgUp = () => {
    if (bgTimer.current) {
      clearTimeout(bgTimer.current);
      bgTimer.current = null;
    }
  };

  return (
    <div className="home-screen" ref={screenRef} onPointerDown={onBgDown} onPointerUp={onBgUp}>
      <div className="home-pager app-scroll" ref={pagerRef} onScroll={onScroll}>
        {launcher.pages.map((pageApps, pi) => (
          <div className="home-page" key={pi}>
            {pi === 0 && (
              <div className="widget-row app-scroll">
                {launcher.widgets.map((wid) => {
                  const w = WIDGETS.find((x) => x.id === wid);
                  return w ? <w.Component key={wid} /> : null;
                })}
                {launcher.widgets.length === 0 && (
                  <button className="widget-add-cta n-card" onClick={() => setEditSheet(true)}>
                    <Plus size={18} /> Add a widget
                  </button>
                )}
              </div>
            )}
            <div className="home-grid" style={{ gap: `${14 + (iconSize - 3) * 2}px` }}>
              {pageApps.map((appId, idx) => (
                <div key={`${pi}-${idx}-${appId}`} data-slot={`${pi}-${idx}`} className="home-slot">
                  <div
                    onPointerDown={startDrag(appId, pi, idx)}
                    className={dropHint === `${pi}-${idx}` ? 'slot-hot' : ''}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  >
                    <AppIcon
                      appId={appId}
                      editMode={editMode}
                      dragging={drag?.appId === appId}
                      onRemove={(id) => removeFromHome(id)}
                      onLongPress={(id) => setMenuAppId(id)}
                    />
                  </div>
                </div>
              ))}
              {editMode && (
                <button className="home-slot add-slot" onClick={() => setEditSheet(true)}>
                  <Plus size={22} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x - 34, top: drag.y - 34 }}>
          <div className="icon-tile" style={{ width: 64, height: 64, background: getApp(drag.appId).tile }}>
            {(() => {
              const A = getApp(drag.appId);
              return <A.Icon size={36} />;
            })()}
          </div>
        </div>
      )}

      <div className="page-dots">
        {launcher.pages.map((_, i) => (
          <button
            key={i}
            className={i === page ? 'active' : ''}
            onClick={() => pagerRef.current?.scrollTo({ left: i * 393, behavior: 'smooth' })}
            aria-label={`Page ${i + 1}`}
          />
        ))}
        {editMode && (
          <button className="dot-add" onClick={addPage} aria-label="Add page">
            <Plus size={11} />
          </button>
        )}
      </div>

      <button className="search-pill" onClick={() => setSearch(true)}>
        <Search size={15} /> Search apps, settings & more
      </button>

      <div className="dock">
        {launcher.dock.map((appId) => (
          <AppIcon
            key={appId}
            appId={appId}
            showLabel={false}
            editMode={editMode}
            onRemove={(id) => removeFromHome(id)}
            onLongPress={(id) => setMenuAppId(id)}
          />
        ))}
      </div>

      {editMode && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="edit-done n-btn accent"
          onClick={() => setEditMode(false)}
        >
          <Check size={16} /> Done
        </motion.button>
      )}

      {/* Long-press app menu */}
      <Sheet open={!!menuAppId} onClose={() => setMenuAppId(null)}>
        {menuApp && (
          <div className="icon-menu">
            <div className="icon-menu-head">
              <span className="icon-tile" style={{ width: 52, height: 52, background: menuApp.tile }}>
                <menuApp.Icon size={30} />
              </span>
              <div>
                <strong>{menuApp.name}</strong>
                {menuApp.limitation && <small>{menuApp.limitation}</small>}
              </div>
            </div>
            <button
              className="sheet-action"
              onClick={() => {
                openApp(menuApp.id);
                setMenuAppId(null);
              }}
            >
              <Pencil size={17} /> Open
            </button>
            <button
              className="sheet-action"
              onClick={() => {
                openFloating(menuApp.id);
                setMenuAppId(null);
              }}
            >
              <AppWindow size={17} /> Open in floating window
            </button>
            <button
              className="sheet-action"
              onClick={() => {
                setEditMode(true);
                setMenuAppId(null);
              }}
            >
              <Copy size={17} /> Edit home screen
            </button>
            <button
              className="sheet-action danger"
              onClick={() => {
                removeFromHome(menuApp.id);
                setMenuAppId(null);
              }}
            >
              <Trash2 size={17} /> Remove from home screen
            </button>
          </div>
        )}
      </Sheet>

      {/* Home / personalisation sheet */}
      <Sheet open={editSheet} onClose={() => setEditSheet(false)} title="Customise home">
        <p className="n-section-title" style={{ paddingLeft: 4 }}>
          Widgets
        </p>
        <div className="widget-picker">
          {WIDGETS.map((w) => {
            const on = launcher.widgets.includes(w.id);
            return (
              <button
                key={w.id}
                className={`chip ${on ? 'active' : ''}`}
                onClick={() =>
                  patchLauncher({
                    widgets: on
                      ? launcher.widgets.filter((x) => x !== w.id)
                      : [...launcher.widgets, w.id],
                  })
                }
              >
                {w.name}
              </button>
            );
          })}
        </div>

        <p className="n-section-title" style={{ paddingLeft: 4 }}>
          Icon size · {iconSize}/5
        </p>
        <input
          className="n-slider"
          type="range"
          min={1}
          max={5}
          value={iconSize}
          style={{ ['--fill' as string]: `${(iconSize / 5) * 100}%` }}
          onChange={(e) => patchSystem({ iconSize: Number(e.target.value) })}
        />

        <p className="n-section-title" style={{ paddingLeft: 4 }}>
          Wallpaper & style
        </p>
        <button className="sheet-action" onClick={() => { setEditSheet(false); openApp('settings'); }}>
          <ImageIcon size={17} /> Open wallpaper & personalisation
        </button>
        <button
          className="sheet-action"
          onClick={() => {
            addPage();
            haptic(10);
          }}
        >
          <Plus size={17} /> Add home screen page
        </button>
      </Sheet>
    </div>
  );
}
