import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Settings as SettingsIcon, User, Wallet, NotebookPen } from 'lucide-react';
import { useOS } from '../../os/store';
import { useData } from '../../os/dataStore';
import { APP_REGISTRY } from '../../os/registry';
import './GlobalSearch.css';

const SETTINGS_ENTRIES = [
  { label: 'Wi-Fi', route: 'network' },
  { label: 'Bluetooth', route: 'connected' },
  { label: 'Display & brightness', route: 'display' },
  { label: 'Wallpaper & personalisation', route: 'personalisation' },
  { label: 'Apps', route: 'apps' },
  { label: 'Notifications', route: 'notifications' },
  { label: 'Sound & vibration', route: 'sound' },
  { label: 'Battery', route: 'battery' },
  { label: 'Storage', route: 'storage' },
  { label: 'Security & privacy', route: 'security' },
  { label: 'Glyph Interface', route: 'glyph' },
  { label: 'System', route: 'system' },
  { label: 'About phone', route: 'about' },
];

interface Result {
  kind: 'app' | 'setting' | 'contact' | 'transaction' | 'note';
  id: string;
  title: string;
  sub?: string;
  action: () => void;
}

export default function GlobalSearch() {
  const open = useOS((s) => s.searchOpen);
  const setOpen = useOS((s) => s.setSearch);
  const openApp = useOS((s) => s.openApp);
  const [query, setQuery] = useState('');
  const contacts = useData((s) => s.contacts);
  const transactions = useData((s) => s.accounting.transactions);
  const notes = useData((s) => s.notes);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];
    APP_REGISTRY.forEach((app) => {
      if (app.name.toLowerCase().includes(q))
        out.push({
          kind: 'app',
          id: app.id,
          title: app.name,
          sub: 'Application',
          action: () => {
            setOpen(false);
            openApp(app.id);
          },
        });
    });
    SETTINGS_ENTRIES.forEach((e) => {
      if (e.label.toLowerCase().includes(q))
        out.push({
          kind: 'setting',
          id: e.route,
          title: e.label,
          sub: 'Settings',
          action: () => {
            setOpen(false);
            openApp('settings');
            window.dispatchEvent(new CustomEvent('os-open-settings', { detail: e.route }));
          },
        });
    });
    contacts.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.phone.includes(q))
        out.push({
          kind: 'contact',
          id: c.id,
          title: c.name,
          sub: c.phone,
          action: () => {
            setOpen(false);
            openApp('contacts');
            window.dispatchEvent(new CustomEvent('os-open-contact', { detail: c.id }));
          },
        });
    });
    transactions.forEach((t) => {
      if (t.note.toLowerCase().includes(q))
        out.push({
          kind: 'transaction',
          id: t.id,
          title: t.note || `${t.type} ${t.amount}`,
          sub: `Accounting · ${t.type}`,
          action: () => {
            setOpen(false);
            openApp('accounting');
          },
        });
    });
    notes.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
        out.push({
          kind: 'note',
          id: n.id,
          title: n.title,
          sub: 'Essential Space',
          action: () => {
            setOpen(false);
            openApp('essential');
          },
        });
    });
    return out.slice(0, 24);
  }, [query, contacts, transactions, notes, openApp, setOpen]);

  const iconFor = (r: Result) => {
    if (r.kind === 'setting') return <SettingsIcon size={17} />;
    if (r.kind === 'contact') return <User size={17} />;
    if (r.kind === 'transaction') return <Wallet size={17} />;
    if (r.kind === 'note') return <NotebookPen size={17} />;
    const app = APP_REGISTRY.find((a) => a.id === r.id);
    return app ? <app.Icon size={18} /> : <Search size={17} />;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-overlay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="global-search-bar">
            <Search size={17} />
            <input
              autoFocus
              placeholder="Search apps, settings, contacts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={() => setOpen(false)} aria-label="Close search">
              <X size={17} />
            </button>
          </div>
          <div className="search-results app-scroll">
            {query && results.length === 0 && <p className="search-empty">No results for “{query}”</p>}
            {results.map((r) => (
              <button key={`${r.kind}-${r.id}`} className="search-row" onClick={r.action}>
                <span className="row-icon">{iconFor(r)}</span>
                <span className="row-text">
                  <span>{r.title}</span>
                  {r.sub && <small>{r.sub}</small>}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
