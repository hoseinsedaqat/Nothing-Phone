import { useEffect, useMemo, useState } from 'react';
import {
  Wifi, Bluetooth, Monitor, Palette, AppWindow, Bell, Volume2, BatteryFull,
  HardDrive, Shield, Sparkles, Settings2, Info, Search, ChevronRight,
} from 'lucide-react';
import { useOS } from '../../os/store';
import { AppChrome, Row } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import {
  NetworkSection, ConnectedSection, DisplaySection, PersonalisationSection,
  AppsSection, NotificationsSection, SoundSection, BatterySection, StorageSection,
  SecuritySection, GlyphSection, SystemSection, AboutSection,
} from './SettingsSections';
import './SettingsApp.css';

const MENU = [
  { id: 'network', label: 'Network & internet', Icon: Wifi, sub: 'Wi-Fi, mobile, hotspot' },
  { id: 'connected', label: 'Connected devices', Icon: Bluetooth, sub: 'Bluetooth pairing' },
  { id: 'display', label: 'Display', Icon: Monitor, sub: 'Brightness, theme, font' },
  { id: 'personalisation', label: 'Personalisation', Icon: Palette, sub: 'Wallpaper, accents, icons' },
  { id: 'apps', label: 'Apps', Icon: AppWindow, sub: 'App info & permissions' },
  { id: 'notifications', label: 'Notifications', Icon: Bell, sub: 'App notification controls' },
  { id: 'sound', label: 'Sound & vibration', Icon: Volume2, sub: 'Volumes, ringtone, DND' },
  { id: 'battery', label: 'Battery', Icon: BatteryFull, sub: 'Saver & usage' },
  { id: 'storage', label: 'Storage', Icon: HardDrive, sub: 'Simulator data usage' },
  { id: 'security', label: 'Security & privacy', Icon: Shield, sub: 'Screen lock, permissions' },
  { id: 'glyph', label: 'Glyph Interface', Icon: Sparkles, sub: 'Rear LED matrix' },
  { id: 'system', label: 'System', Icon: Settings2, sub: 'Language, reset, updates' },
  { id: 'about', label: 'About phone', Icon: Info, sub: 'Nothing Phone (3) specs' },
];

export default function SettingsApp() {
  const { current, push, pop } = useScreenStack('main');
  const [query, setQuery] = useState('');
  const sys = useOS((s) => s.system);

  useEffect(() => {
    const h = (e: Event) => push((e as CustomEvent).detail as string);
    window.addEventListener('os-open-settings', h);
    return () => window.removeEventListener('os-open-settings', h);
  }, [push]);

  const menu = useMemo(
    () => MENU.filter((m) => !query || m.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  if (current.screen !== 'main') {
    const Section = {
      network: NetworkSection,
      connected: ConnectedSection,
      display: DisplaySection,
      personalisation: PersonalisationSection,
      apps: AppsSection,
      notifications: NotificationsSection,
      sound: SoundSection,
      battery: BatterySection,
      storage: StorageSection,
      security: SecuritySection,
      glyph: GlyphSection,
      system: SystemSection,
      about: AboutSection,
    }[current.screen as string];
    if (!Section) return null;
    return (
      <div className="settings-section">
        <Section onBack={pop} params={current.params} />
      </div>
    );
  }

  return (
    <AppChrome title="Settings">
      <div className="settings-search contacts-search">
        <Search size={15} />
        <input placeholder="Search settings" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="settings-hero n-card">
        <span className="settings-avatar">NP3</span>
        <div>
          <strong>Nothing Phone (3)</strong>
          <small>Nothing OS 5.0 · {sys.wifi ? `Connected · ${sys.wifiNetwork}` : 'Offline'}</small>
        </div>
        <ChevronRight size={18} className="row-chevron" />
      </div>

      <div className="n-list-group" style={{ margin: '12px 16px' }}>
        {menu.map((m) => (
          <Row
            key={m.id}
            icon={<m.Icon size={17} />}
            label={m.label}
            sub={m.sub}
            onClick={() => push(m.id)}
          />
        ))}
      </div>
      <p className="sim-note">
        Hardware-related controls (real radios, screen hardware, firmware) are simulated — no physical
        device is controlled by this web app.
      </p>
    </AppChrome>
  );
}
