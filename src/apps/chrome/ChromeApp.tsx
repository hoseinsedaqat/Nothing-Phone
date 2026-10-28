import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, RotateCw, MoreVertical, Plus, Layers, Lock,
  Star, History, Download, Settings as SettingsIcon, Shield, Search, X, Trash2, ExternalLink,
} from 'lucide-react';
import { ChromeMark } from '../../os/icons';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { Sheet, EmptyState, ConfirmDialog } from '../../components/ui';
import { uid } from '../../os/storage';
import { normalizeInput, SHORTCUTS, withActiveTab, openInTab, createTab, closeTab } from './chromeUtils';
import type { BrowserState } from '../../os/types';
import './ChromeApp.css';

type Panel = 'menu' | 'tabs' | 'bookmarks' | 'history' | 'downloads' | 'settings' | null;

export default function ChromeApp() {
  const browser = useData((s) => s.browser);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const [panel, setPanel] = useState<Panel>(null);
  const [address, setAddress] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const blockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tab = browser.tabs.find((t) => t.id === browser.activeTabId) ?? browser.tabs[0];
  const set = (fn: (b: BrowserState) => BrowserState) => patch('browser', fn(browser));

  useEffect(() => {
    setAddress(tab?.url ?? '');
  }, [tab?.id, tab?.url]);

  // Blocked-frame watchdog
  useEffect(() => {
    if (blockTimer.current) clearTimeout(blockTimer.current);
    if (tab?.loading && tab.url) {
      blockTimer.current = setTimeout(() => {
        set((b) => withActiveTab(b, (t) => ({ ...t, loading: false, blocked: true })));
      }, 6500);
    }
    return () => {
      if (blockTimer.current) clearTimeout(blockTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab?.id, tab?.url, tab?.loading]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    set((b) => openInTab(b, address));
  };

  const navigateHistory = (delta: number) => {
    set((b) =>
      withActiveTab(b, (t) => {
        const idx = t.historyIndex + delta;
        if (idx < 0 || idx >= t.history.length) return t;
        return { ...t, historyIndex: idx, url: t.history[idx], loading: true, blocked: false, title: t.history[idx] };
      }),
    );
  };

  const reload = () => set((b) => withActiveTab(b, (t) => ({ ...t, loading: true, blocked: false })));
  const canBack = tab && tab.historyIndex > 0;
  const canFwd = tab && tab.historyIndex < tab.history.length - 1;
  const bookmarked = tab ? browser.bookmarks.some((b) => b.url === tab.url && tab.url) : false;

  const toggleBookmark = () => {
    if (!tab?.url) return;
    if (bookmarked) {
      set((b) => ({ ...b, bookmarks: b.bookmarks.filter((x) => x.url !== tab.url) }));
      showToast('Bookmark removed');
    } else {
      set((b) => ({
        ...b,
        bookmarks: [{ id: uid(), title: tab.title || tab.url, url: tab.url, addedAt: Date.now() }, ...b.bookmarks],
      }));
      showToast('Bookmarked');
    }
  };

  const simDownload = () => {
    if (!tab?.url) return;
    const name = tab.url.split('/').pop()?.split('?')[0] || 'download.bin';
    set((b) => ({
      ...b,
      downloads: [
        { id: uid(), name, url: tab.url, size: `${(Math.random() * 12 + 0.4).toFixed(1)} MB`, at: Date.now() },
        ...b.downloads,
      ],
    }));
    showToast(`Downloading ${name} (simulated)`);
  };

  return (
    <div className={`chrome-app ${tab?.incognito ? 'incognito' : ''}`}>
      <header className="chrome-top">
        <div className="chrome-top-row">
          <button className="chrome-icon-btn" onClick={() => setPanel('tabs')} aria-label="Tabs">
            <Layers size={17} />
            <span className="tab-badge">{browser.tabs.length}</span>
          </button>
          <ChromeMark size={22} />
          <strong className="chrome-brand">Chrome{tab?.incognito ? ' · Incognito' : ''}</strong>
          <button className="chrome-icon-btn" onClick={() => setPanel('menu')} aria-label="Menu">
            <MoreVertical size={18} />
          </button>
        </div>
        <form className="address-bar" onSubmit={submit}>
          <button type="button" className="chrome-icon-btn" disabled={!canBack} onClick={() => navigateHistory(-1)} aria-label="Back">
            <ChevronLeft size={19} />
          </button>
          <button type="button" className="chrome-icon-btn" disabled={!canFwd} onClick={() => navigateHistory(1)} aria-label="Forward">
            <ChevronRight size={19} />
          </button>
          <button type="button" className="chrome-icon-btn" onClick={reload} aria-label="Reload">
            <RotateCw size={15} className={tab?.loading ? 'animate-spin-slow' : ''} />
          </button>
          <div className="address-input">
            <Lock size={12} />
            <input
              value={address}
              placeholder="Search or type URL"
              onChange={(e) => setAddress(e.target.value)}
              aria-label="Address"
              spellCheck={false}
            />
          </div>
        </form>
      </header>

      <div className="chrome-content">
        {!tab?.url ? (
          <NewTabPage browser={browser} onOpen={(url) => set((b) => openInTab(b, url))} />
        ) : tab.blocked ? (
          <BlockedPanel url={tab.url} />
        ) : (
          <iframe
            key={tab.id + tab.url}
            src={tab.url}
            className="chrome-frame"
            title="web"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={() => set((b) => withActiveTab(b, (t) => ({ ...t, loading: false, blocked: false })))}
          />
        )}
        {tab?.loading && !tab.blocked && (
          <div className="chrome-loading">
            <div className="chrome-progress" />
          </div>
        )}
      </div>

      {/* Menu */}
      <Sheet open={panel === 'menu'} onClose={() => setPanel(null)}>
        <button className="sheet-action" onClick={() => { set((b) => createTab(b)); setPanel(null); }}><Plus size={17} /> New tab</button>
        <button className="sheet-action" onClick={() => { set((b) => createTab(b, true)); setPanel(null); }}><Shield size={17} /> New incognito tab</button>
        <button className="sheet-action" onClick={toggleBookmark}><Star size={17} /> {bookmarked ? 'Remove bookmark' : 'Bookmark this page'}</button>
        <button className="sheet-action" onClick={simDownload}><Download size={17} /> Download page (simulated)</button>
        <button className="sheet-action" onClick={() => setPanel('bookmarks')}><Star size={17} /> Bookmarks ({browser.bookmarks.length})</button>
        <button className="sheet-action" onClick={() => setPanel('history')}><History size={17} /> History</button>
        <button className="sheet-action" onClick={() => setPanel('downloads')}><Download size={17} /> Downloads</button>
        <button className="sheet-action" onClick={() => setPanel('settings')}><SettingsIcon size={17} /> Browser settings</button>
        <button
          className="sheet-action danger"
          onClick={() => { set((b) => closeTab(b, tab.id)); setPanel(null); }}
        >
          <X size={17} /> Close this tab
        </button>
      </Sheet>

      {/* Tab switcher */}
      <Sheet open={panel === 'tabs'} onClose={() => setPanel(null)} title={`${browser.tabs.length} tabs`}>
        <button className="n-btn accent" style={{ width: '100%', marginBottom: 12 }} onClick={() => set((b) => createTab(b, false))}>
          <Plus size={16} /> New tab
        </button>
        {browser.tabs.map((t) => (
          <div className={`tab-row n-card ${t.id === tab?.id ? 'current' : ''}`} key={t.id}>
            <button className="tab-row-open" onClick={() => { set((b) => ({ ...b, activeTabId: t.id })); setPanel(null); }}>
              {t.incognito && <Shield size={14} />}
              <span>{t.title || 'New tab'}</span>
            </button>
            <button onClick={() => set((b) => closeTab(b, t.id))} aria-label="Close tab"><X size={15} /></button>
          </div>
        ))}
      </Sheet>

      {/* Bookmarks */}
      <Sheet open={panel === 'bookmarks'} onClose={() => setPanel(null)} title="Bookmarks">
        {browser.bookmarks.length === 0 ? (
          <EmptyState icon={<Star size={24} />} title="No bookmarks" text="Star a page from the Chrome menu to keep it here." />
        ) : (
          browser.bookmarks.map((b) => (
            <div className="n-list-row" key={b.id}>
              <button className="files-open" onClick={() => { set((s) => openInTab(s, b.url)); setPanel(null); }}>
                <span className="row-icon"><Star size={15} /></span>
                <span className="row-text"><span>{b.title}</span><small>{b.url}</small></span>
              </button>
              <button className="inline-icon danger" onClick={() => set((s) => ({ ...s, bookmarks: s.bookmarks.filter((x) => x.id !== b.id) }))} aria-label="Remove">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </Sheet>

      {/* History */}
      <Sheet open={panel === 'history'} onClose={() => setPanel(null)} title="History">
        {browser.history.length === 0 ? (
          <EmptyState icon={<History size={24} />} title="No history yet" text="Pages you visit are stored on this device only." />
        ) : (
          <>
            {browser.history.map((h) => (
              <button key={h.id} className="n-list-row" style={{ width: '100%' }} onClick={() => { set((s) => openInTab(s, h.url)); setPanel(null); }}>
                <span className="row-icon"><History size={15} /></span>
                <span className="row-text"><span>{h.title}</span><small>{new Date(h.visitedAt).toLocaleString()}</small></span>
              </button>
            ))}
            <button className="n-btn danger" style={{ width: '100%', marginTop: 12 }} onClick={() => setConfirmClear(true)}>
              <Trash2 size={15} /> Clear browsing history
            </button>
          </>
        )}
      </Sheet>

      {/* Downloads */}
      <Sheet open={panel === 'downloads'} onClose={() => setPanel(null)} title="Downloads">
        {browser.downloads.length === 0 ? (
          <EmptyState icon={<Download size={24} />} title="No downloads" text="Simulated downloads started from the menu appear here." />
        ) : (
          browser.downloads.map((d) => (
            <div className="n-list-row" key={d.id}>
              <span className="row-icon"><Download size={15} /></span>
              <span className="row-text"><span>{d.name}</span><small>{d.size} · {new Date(d.at).toLocaleString()}</small></span>
              <button className="inline-icon" onClick={() => window.open(d.url, '_blank', 'noopener')} aria-label="Open externally">
                <ExternalLink size={15} />
              </button>
            </div>
          ))
        )}
      </Sheet>

      {/* Settings */}
      <Sheet open={panel === 'settings'} onClose={() => setPanel(null)} title="Browser settings">
        <p className="n-section-title" style={{ paddingLeft: 4 }}>Search engine</p>
        <div className="engine-list">
          {(['google', 'duckduckgo', 'bing'] as const).map((e) => (
            <button key={e} className={`chip ${browser.searchEngine === e ? 'active' : ''}`} onClick={() => set((b) => ({ ...b, searchEngine: e }))}>
              {e[0].toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        <button className="n-btn danger" style={{ width: '100%', marginTop: 16 }} onClick={() => setConfirmClear(true)}>
          <Trash2 size={15} /> Clear history & cookies (simulated)
        </button>
      </Sheet>

      <ConfirmDialog
        open={confirmClear}
        title="Clear browsing data?"
        text="History will be removed. Bookmarks and open tabs are kept."
        danger
        confirmLabel="Clear"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          set((b) => ({ ...b, history: [] }));
          setConfirmClear(false);
          setPanel(null);
          showToast('Browsing history cleared');
        }}
      />
    </div>
  );
}

function NewTabPage({ browser, onOpen }: { browser: BrowserState; onOpen: (url: string) => void }) {
  const engine = useMemo(() => browser.searchEngine, [browser.searchEngine]);
  const [q, setQ] = useState('');
  return (
    <div className="new-tab app-scroll">
      <div className="ntp-logo"><ChromeMark size={44} /><h2>Search the web</h2></div>
      <form
        className="ntp-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onOpen(normalizeInput(q, engine));
        }}
      >
        <Search size={17} />
        <input placeholder="Search with engine…" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <div className="ntp-shortcuts">
        {SHORTCUTS.map((s) => (
          <button key={s.url} className="ntp-shortcut" onClick={() => onOpen(s.url)}>
            <span style={{ background: s.color }}>{s.letter}</span>
            <small>{s.name}</small>
          </button>
        ))}
      </div>
      {browser.bookmarks.length > 0 && (
        <>
          <p className="n-section-title">Bookmarks</p>
          {browser.bookmarks.slice(0, 5).map((b) => (
            <button key={b.id} className="n-list-row" style={{ width: '100%' }} onClick={() => onOpen(b.url)}>
              <span className="row-icon"><Star size={14} /></span>
              <span className="row-text"><span>{b.title}</span></span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function BlockedPanel({ url }: { url: string }) {
  return (
    <div className="blocked-panel">
      <Shield size={34} />
      <h3>This site can’t be embedded</h3>
      <p>
        {url} sends security headers that forbid loading inside an iframe (common for Google, social
        networks and banks). This is a browser simulator — it cannot render those pages inline.
      </p>
      <button className="n-btn accent" onClick={() => window.open(url, '_blank', 'noopener')}>
        <ExternalLink size={15} /> Open in your real browser
      </button>
    </div>
  );
}
