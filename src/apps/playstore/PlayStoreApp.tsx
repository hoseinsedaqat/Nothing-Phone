import { useMemo, useState } from 'react';
import { Search, Star, Download, Check, ShieldAlert, Store } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { APP_REGISTRY } from '../../os/registry';
import { AppChrome, EmptyState } from '../../components/ui';
import './PlayStoreApp.css';

interface CatalogItem {
  id: string;
  name: string;
  dev: string;
  rating: number;
  size: string;
  desc: string;
  real: boolean;
  appId?: string;
}

const EXTRA_CATALOG: CatalogItem[] = [
  { id: 'spotify', name: 'Spotify', dev: 'Spotify AB', rating: 4.6, size: '42 MB', desc: 'Music and podcasts (simulated listing).', real: false },
  { id: 'gmail', name: 'Gmail', dev: 'Google LLC', rating: 4.4, size: '28 MB', desc: 'Email client (simulated listing).', real: false },
  { id: 'maps', name: 'Google Maps', dev: 'Google LLC', rating: 4.5, size: '65 MB', desc: 'Navigation (simulated listing).', real: false },
  { id: 'nothingx', name: 'Nothing X', dev: 'Nothing', rating: 4.3, size: '18 MB', desc: 'Ear companion app (simulated listing).', real: false },
  { id: 'notion', name: 'Notion', dev: 'Notion Labs', rating: 4.7, size: '35 MB', desc: 'Workspace docs (simulated listing).', real: false },
];

export default function PlayStoreApp() {
  const installed = useData((s) => s.installed);
  const patch = useData((s) => s.patch);
  const openApp = useOS((s) => s.openApp);
  const showToast = useOS((s) => s.showToast);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'apps' | 'search'>('apps');

  const catalog: CatalogItem[] = useMemo(
    () => [
      ...APP_REGISTRY.map((a) => ({
        id: a.id,
        appId: a.id,
        name: a.name,
        dev: 'Nothing Simulator',
        rating: 4.5,
        size: 'Built-in',
        desc: a.limitation ?? 'Fully functional simulator app.',
        real: true,
      })),
      ...EXTRA_CATALOG,
    ],
    [],
  );

  const shown = catalog.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const install = (item: CatalogItem) => {
    patch('installed', { ...useData.getState().installed, [item.id]: true });
    showToast(item.real ? `${item.name} is ready` : `${item.name} installed (simulation — no real download)`);
  };

  return (
    <AppChrome title="Play Store">
      <div className="store-search contacts-search">
        <Search size={15} />
        <input placeholder="Search apps & games" value={query} onChange={(e) => { setQuery(e.target.value); setTab('search'); }} />
      </div>
      <div className="store-tabs">
        <button className={tab === 'apps' ? 'active' : ''} onClick={() => setTab('apps')}>For you</button>
        <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>Search</button>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<Store size={26} />} title="Nothing found" text={`No apps match “${query}”.`} />
      ) : (
        <div className="store-list">
          {shown.map((item) => {
            const isInstalled = item.real || installed[item.id];
            const app = item.appId ? APP_REGISTRY.find((a) => a.id === item.appId) : null;
            return (
              <div className="store-item n-card" key={item.id}>
                <span className="store-icon icon-tile" style={{ background: app?.tile ?? '#26262a', width: 52, height: 52 }}>
                  {app ? <app.Icon size={28} /> : <Store size={22} />}
                </span>
                <div className="store-meta">
                  <strong>{item.name}</strong>
                  <small>{item.dev}</small>
                  <span className="store-rating"><Star size={11} fill="currentColor" /> {item.rating} · {item.size}</span>
                  <p>{item.desc}</p>
                </div>
                {isInstalled ? (
                  app ? (
                    <button className="n-btn" onClick={() => openApp(app.id)}><Check size={14} /> Open</button>
                  ) : (
                    <button className="n-btn" disabled><Check size={14} /> Installed</button>
                  )
                ) : (
                  <button className="n-btn accent" onClick={() => install(item)}><Download size={14} /> Install</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="sim-note">
        <ShieldAlert size={12} /> Simulated store: third-party apps are listings only and are not really
        downloaded or executed.
      </p>
    </AppChrome>
  );
}
