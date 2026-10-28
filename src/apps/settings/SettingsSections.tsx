import { useMemo, useState } from 'react';
import {
  Wifi, Bluetooth, Plane, Radio, Signal, Monitor, Moon, Sun, Palette, Type,
  Expand, Timer, Bell, Volume2, Vibrate, BatteryFull, Leaf, HardDrive, Shield,
  Lock, Sparkles, Info, Check, Trash2, Plus, RefreshCw, Download, Upload, Music2,
} from 'lucide-react';
import { useOS } from '../../os/store';
import { useData } from '../../os/dataStore';
import { APP_REGISTRY, getApp } from '../../os/registry';
import { Row, Switch, Slider, Segmented, EmptyState, ConfirmDialog, Sheet } from '../../components/ui';
import SectionShell, { type SectionProps } from './SectionShell';
import { exportAllData, importAllData, resetAllSlices, resetSlice, uid } from '../../os/storage';
import { WALLPAPERS, ACCENTS, RINGTONES, TIMEOUTS } from './settingsOptions';
import { playRingtonePreview } from '../../os/sound';
import './SettingsApp.css';

const P = ({ children }: { children: React.ReactNode }) => <p className="n-section-title">{children}</p>;

// ── Network ──────────────────────────────────────────────────
export function NetworkSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  return (
    <SectionShell title="Network & internet" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Wifi size={17} />} label="Wi-Fi" sub={sys.wifi ? sys.wifiNetwork : 'Off'} right={<Switch on={sys.wifi} onChange={(v) => patch({ wifi: v })} />} />
        <Row icon={<Signal size={17} />} label="Mobile network" sub={sys.mobileData ? 'Simulated LTE' : 'Off'} right={<Switch on={sys.mobileData && !sys.airplane} onChange={(v) => patch({ mobileData: v })} />} />
        <Row icon={<Plane size={17} />} label="Airplane mode" right={<Switch on={sys.airplane} onChange={(v) => patch({ airplane: v, wifi: v ? false : sys.wifi, bluetooth: v ? false : sys.bluetooth })} />} />
        <Row icon={<Radio size={17} />} label="Hotspot" sub={sys.hotspot ? 'Nothing-AP active' : 'Off'} right={<Switch on={sys.hotspot} onChange={(v) => patch({ hotspot: v })} />} />
      </div>
      <P>Available networks</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {sys.savedNetworks.map((n) => (
          <Row
            key={n}
            icon={<Wifi size={16} />}
            label={n}
            sub={n === sys.wifiNetwork ? 'Connected' : 'Saved · tap to connect'}
            onClick={() => patch({ wifiNetwork: n, wifi: true })}
            right={n === sys.wifiNetwork ? <Check size={17} color="var(--accent)" /> : undefined}
          />
        ))}
        <Row
          icon={<Plus size={16} />}
          label="Add network"
          onClick={() => {
            const name = prompt('Network name (SSID):');
            if (name) patch({ savedNetworks: [...sys.savedNetworks, name], wifiNetwork: name, wifi: true });
          }}
        />
      </div>
      <P>Data usage (simulated)</P>
      <div className="n-card usage-card" style={{ margin: '0 12px' }}>
        <div><strong>{sys.dataUsage.mobile} GB</strong><small>Mobile this month</small></div>
        <div><strong>{sys.dataUsage.wifi} GB</strong><small>Wi-Fi this month</small></div>
      </div>
    </SectionShell>
  );
}

// ── Connected devices / Bluetooth ────────────────────────────
export function ConnectedSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const showToast = useOS((s) => s.showToast);
  const [pairing, setPairing] = useState(false);

  const setConnected = (id: string, connected: boolean) =>
    patch({
      pairedDevices: sys.pairedDevices.map((d) => ({ ...d, connected: d.id === id ? connected : false })),
    });

  return (
    <SectionShell title="Connected devices" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Bluetooth size={17} />} label="Bluetooth" sub={sys.bluetooth ? 'On' : 'Off'} right={<Switch on={sys.bluetooth} onChange={(v) => patch({ bluetooth: v })} />} />
      </div>
      <P>Saved devices</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {sys.pairedDevices.map((d) => (
          <Row
            key={d.id}
            icon={<Bluetooth size={16} />}
            label={d.name}
            sub={d.connected ? 'Connected' : 'Paired'}
            right={
              sys.bluetooth ? (
                <Switch on={d.connected} onChange={(v) => setConnected(d.id, v)} />
              ) : undefined
            }
            onClick={sys.bluetooth ? () => setConnected(d.id, !d.connected) : undefined}
          />
        ))}
        <Row
          icon={<Plus size={16} />}
          label="Pair new device"
          onClick={() => {
            if (!sys.bluetooth) {
              showToast('Turn Bluetooth on first');
              return;
            }
            setPairing(true);
          }}
        />
      </div>
      <Sheet open={pairing} onClose={() => setPairing(false)} title="Available devices">
        {['Nothing Ear (open)', 'JBL Flip 7', 'Toyota Corolla', 'Galaxy Watch'].map((name, i) => (
          <Row
            key={name}
            icon={<Bluetooth size={16} />}
            label={name}
            sub="Tap to pair"
            onClick={() => {
              const dev = { id: uid(), name, kind: (['headphones', 'speaker', 'car', 'watch'] as const)[i], paired: true, connected: false };
              patch({ pairedDevices: [...sys.pairedDevices, dev] });
              setPairing(false);
              showToast(`${name} paired`);
            }}
          />
        ))}
      </Sheet>
    </SectionShell>
  );
}

// ── Display ──────────────────────────────────────────────────
export function DisplaySection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  return (
    <SectionShell title="Display" onBack={onBack}>
      <P>Brightness · {sys.brightness}%</P>
      <div style={{ padding: '4px 18px' }}>
        <Slider value={sys.brightness} onChange={(v) => patch({ brightness: v })} label="Brightness" />
      </div>
      <P>Theme</P>
      <div style={{ padding: '0 16px' }}>
        <Segmented
          value={sys.darkMode ? 'dark' : 'light'}
          onChange={(v) => patch({ darkMode: v === 'dark' })}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
        />
      </div>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Moon size={17} />} label="Extra dark" sub="Deepens black surfaces" right={<Switch on={sys.extraDark} onChange={(v) => patch({ extraDark: v })} />} />
        <Row icon={<Type size={17} />} label="Font size" sub={sys.fontScale} />
      </div>
      <div style={{ padding: '0 16px' }}>
        <Segmented
          value={sys.fontScale}
          onChange={(v) => patch({ fontScale: v as typeof sys.fontScale })}
          options={[
            { id: 'small', label: 'Small' },
            { id: 'default', label: 'Default' },
            { id: 'large', label: 'Large' },
          ]}
        />
      </div>
      <P>Display size · {Math.round(sys.displaySize * 100)}%</P>
      <div style={{ padding: '4px 18px' }}>
        <Slider min={85} max={115} value={Math.round(sys.displaySize * 100)} onChange={(v) => patch({ displaySize: v / 100 })} />
      </div>
      <P>Screen timeout</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        {TIMEOUTS.map((t) => (
          <Row
            key={t.value}
            icon={<Timer size={16} />}
            label={t.label}
            right={sys.screenTimeout === t.value ? <Check size={17} color="var(--accent)" /> : undefined}
            onClick={() => patch({ screenTimeout: t.value })}
          />
        ))}
      </div>
    </SectionShell>
  );
}

// ── Personalisation ──────────────────────────────────────────
export function PersonalisationSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const launcher = useOS((s) => s.launcher);
  const patchLauncher = useOS((s) => s.patchLauncher);
  return (
    <SectionShell title="Personalisation" onBack={onBack}>
      <P>Wallpaper</P>
      <div className="wallpaper-grid">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            className={`wallpaper-thumb wp-${w.id} ${sys.wallpaper === w.id && !sys.customWallpaper ? 'on' : ''}`}
            onClick={() => patch({ wallpaper: w.id, customWallpaper: null })}
            aria-label={w.name}
          >
            {sys.wallpaper === w.id && !sys.customWallpaper && <Check size={16} />}
          </button>
        ))}
      </div>
      {sys.customWallpaper && (
        <button className="n-btn" style={{ margin: '8px 16px' }} onClick={() => patch({ customWallpaper: null })}>
          Remove custom photo wallpaper
        </button>
      )}
      <P>Accent colour</P>
      <div className="accent-row">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            className={`accent-dot ${sys.accent === a.id ? 'on' : ''}`}
            style={{ background: a.color }}
            onClick={() => patch({ accent: a.id })}
            aria-label={a.name}
          />
        ))}
      </div>
      <P>Icon style</P>
      <div style={{ padding: '0 16px' }}>
        <Segmented
          value={sys.iconStyle}
          onChange={(v) => patch({ iconStyle: v as 'mono' | 'color' })}
          options={[
            { id: 'mono', label: 'Monochrome' },
            { id: 'color', label: 'Colour' },
          ]}
        />
      </div>
      <P>Home icon size · {sys.iconSize}/5</P>
      <div style={{ padding: '4px 18px' }}>
        <Slider min={1} max={5} value={sys.iconSize} onChange={(v) => patch({ iconSize: v })} />
      </div>
      <P>Lock screen clock</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        <Row icon={<Expand size={16} />} label="Show notifications on lock screen" right={<Switch on={sys.lockNotifications} onChange={(v) => patch({ lockNotifications: v })} />} />
        <Row icon={<Palette size={16} />} label="Widgets on home screen" sub={`${launcher.widgets.length} active`} />
      </div>
    </SectionShell>
  );
}

// ── Apps ─────────────────────────────────────────────────────
export function AppsSection({ onBack, params }: SectionProps) {
  const [selected, setSelected] = useState<string | null>((params?.appId as string) ?? null);
  const notifEnabled = useOS((s) => s.notifEnabled);
  const toggleNotif = useOS((s) => s.toggleAppNotifications);
  const resetAppData = useData((s) => s.resetAppData);
  const showToast = useOS((s) => s.showToast);
  const [confirmClear, setConfirmClear] = useState(false);
  const app = selected ? getApp(selected) : null;

  if (app) {
    const dataKey: Record<string, Parameters<typeof resetAppData>[0]> = {
      chrome: 'browser', accounting: 'accounting', contacts: 'contacts', messages: 'threads',
      calendar: 'events', photos: 'photos', files: 'files', essential: 'notes', clock: 'alarms',
      weather: 'weather', recorder: 'recordings',
    };
    return (
      <SectionShell title={app.name} onBack={() => setSelected(null)}>
        <div className="app-detail-head">
          <span className="icon-tile" style={{ width: 64, height: 64, background: app.tile }}>
            <app.Icon size={36} />
          </span>
          <div>
            <strong>{app.name}</strong>
            <small>Version 1.0.0 · Simulator build</small>
            {app.limitation && <small className="limit">{app.limitation}</small>}
          </div>
        </div>
        <div className="n-list-group" style={{ margin: 12 }}>
          <Row
            icon={<Bell size={16} />}
            label="Notifications"
            right={<Switch on={notifEnabled[app.id] ?? true} onChange={() => toggleNotif(app.id)} />}
          />
          <Row icon={<Shield size={16} />} label="Permissions" sub="Simulated: camera, microphone, storage" />
          <Row icon={<HardDrive size={16} />} label="Storage" sub={`Est. ${(2 + app.id.length * 3) % 90} MB used`} />
        </div>
        <div style={{ padding: 12 }}>
          <button className="n-btn danger" style={{ width: '100%' }} onClick={() => setConfirmClear(true)}>
            <Trash2 size={16} /> Clear local app data
          </button>
        </div>
        <ConfirmDialog
          open={confirmClear}
          title={`Clear data for ${app.name}?`}
          text="All locally stored information for this app will be reset to defaults."
          danger
          confirmLabel="Clear data"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            const key = dataKey[app.id];
            if (key) resetAppData(key);
            setConfirmClear(false);
            setSelected(null);
          }}
        />
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Apps" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        {APP_REGISTRY.map((a) => (
          <Row
            key={a.id}
            icon={
              <span className="icon-tile" style={{ width: 34, height: 34, background: a.tile }}>
                <a.Icon size={19} />
              </span>
            }
            label={a.name}
            sub={a.limitation ? 'Simulated capabilities' : 'Installed'}
            onClick={() => setSelected(a.id)}
          />
        ))}
      </div>
      <div style={{ padding: '0 12px 16px' }}>
        <button
          className="n-btn"
          style={{ width: '100%' }}
          onClick={() => {
            useOS.setState({ notifEnabled: {} });
            showToast('App preferences reset');
          }}
        >
          Reset app preferences
        </button>
      </div>
    </SectionShell>
  );
}

// ── Notifications ────────────────────────────────────────────
export function NotificationsSection({ onBack }: SectionProps) {
  const notifEnabled = useOS((s) => s.notifEnabled);
  const toggle = useOS((s) => s.toggleAppNotifications);
  const notifications = useOS((s) => s.notifications);
  const clearAll = useOS((s) => s.clearNotifications);
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  return (
    <SectionShell title="Notifications" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Lock size={16} />} label="Show on lock screen" right={<Switch on={sys.lockNotifications} onChange={(v) => patch({ lockNotifications: v })} />} />
        <Row icon={<Moon size={16} />} label="Do Not Disturb" right={<Switch on={sys.dnd} onChange={(v) => patch({ dnd: v })} />} />
      </div>
      <P>App notifications</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {APP_REGISTRY.map((a) => (
          <Row
            key={a.id}
            icon={<span className="icon-tile" style={{ width: 32, height: 32, background: a.tile }}><a.Icon size={17} /></span>}
            label={a.name}
            right={<Switch on={notifEnabled[a.id] ?? true} onChange={() => toggle(a.id)} />}
          />
        ))}
      </div>
      <P>Recent notifications · {notifications.length}</P>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={24} />} title="Nothing recent" text="Notifications will collect here." />
      ) : (
        <div style={{ padding: 12 }}>
          <button className="n-btn" style={{ width: '100%' }} onClick={clearAll}><Trash2 size={15} /> Clear history</button>
        </div>
      )}
    </SectionShell>
  );
}

// ── Sound ────────────────────────────────────────────────────
export function SoundSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const beep = () => playRingtonePreview();
  return (
    <SectionShell title="Sound & vibration" onBack={onBack}>
      <P>Media · {sys.mediaVol}%</P>
      <div style={{ padding: '4px 18px' }}><Slider value={sys.mediaVol} onChange={(v) => patch({ mediaVol: v })} /></div>
      <P>Ring · {sys.ringVol}%</P>
      <div style={{ padding: '4px 18px' }}><Slider value={sys.ringVol} onChange={(v) => patch({ ringVol: v })} /></div>
      <P>Notification · {sys.notifVol}%</P>
      <div style={{ padding: '4px 18px 12px' }}><Slider value={sys.notifVol} onChange={(v) => patch({ notifVol: v })} /></div>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Volume2 size={16} />} label="Silent mode" right={<Switch on={sys.silent} onChange={(v) => patch({ silent: v })} />} />
        <Row
          icon={<Music2 size={16} />}
          label="Sound effects"
          right={<Switch on={sys.soundEffects} onChange={(v) => patch({ soundEffects: v })} />}
        />
        <Row icon={<Vibrate size={16} />} label="Vibration" right={<Switch on={sys.vibrate} onChange={(v) => patch({ vibrate: v })} />} />
        <Row icon={<Moon size={16} />} label="Do Not Disturb" right={<Switch on={sys.dnd} onChange={(v) => patch({ dnd: v })} />} />
      </div>
      <P>Ringtone</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        {RINGTONES.map((r) => (
          <Row
            key={r}
            icon={<Bell size={15} />}
            label={r}
            onClick={() => {
              patch({ ringtone: r });
              beep();
            }}
            right={sys.ringtone === r ? <Check size={17} color="var(--accent)" /> : undefined}
          />
        ))}
      </div>
    </SectionShell>
  );
}

// ── Battery ──────────────────────────────────────────────────
export function BatterySection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const bars = useMemo(() => Array.from({ length: 18 }, (_, i) => 30 + Math.round(45 * Math.abs(Math.sin(i * 1.3)) + (i < 6 ? 20 : 0))), []);
  const usage = [
    { app: 'Chrome', pct: 24 }, { app: 'Accounting', pct: 16 }, { app: 'Screen', pct: 14 },
    { app: 'Messages', pct: 9 }, { app: 'Idle', pct: 37 },
  ];
  return (
    <SectionShell title="Battery" onBack={onBack}>
      <div className="battery-hero n-card">
        <BatteryFull size={34} color={sys.batterySaver ? '#30d158' : 'var(--accent)'} />
        <strong>{sys.batteryLevel}%</strong>
        <small>{sys.charging ? 'Charging (simulated)' : `About ${Math.round(sys.batteryLevel * 0.11)} h left (estimated)`}</small>
      </div>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Leaf size={16} />} label="Battery Saver" right={<Switch on={sys.batterySaver} onChange={(v) => patch({ batterySaver: v })} />} />
        <Row icon={<BatteryFull size={16} />} label="Simulate charging" right={<Switch on={sys.charging} onChange={(v) => patch({ charging: v })} />} />
      </div>
      <P>Last 18 hours (simulated)</P>
      <div className="battery-chart">
        {bars.map((h, i) => (
          <span key={i} style={{ height: `${h}%`, opacity: i > 12 ? 0.35 : 1 }} />
        ))}
      </div>
      <P>App usage</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        {usage.map((u) => (
          <div className="n-list-row" key={u.app}>
            <span className="row-text">
              <span>{u.app}</span>
              <span className="usage-bar"><i style={{ width: `${u.pct * 2.4}%` }} /></span>
            </span>
            <strong>{u.pct}%</strong>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ── Storage ──────────────────────────────────────────────────
export function StorageSection({ onBack }: SectionProps) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const sizes = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('np3:')) continue;
      const slice = k.split(':')[2] ?? k;
      map[slice] = (map[slice] ?? 0) + (localStorage.getItem(k)?.length ?? 0) * 2;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const total = sizes.reduce((a, [, v]) => a + v, 0);
  return (
    <SectionShell title="Storage" onBack={() => { setTick((t) => t + 1); onBack(); }}>
      <div className="battery-hero n-card">
        <HardDrive size={30} />
        <strong>{(total / 1024).toFixed(1)} KB</strong>
        <small>Used by simulator data in this browser</small>
      </div>
      <P>Data categories</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {sizes.length === 0 && <Row icon={<HardDrive size={16} />} label="No stored data yet" />}
        {sizes.map(([slice, bytes]) => (
          <div className="n-list-row" key={slice}>
            <span className="row-text"><span style={{ textTransform: 'capitalize' }}>{slice}</span><small>{(bytes / 1024).toFixed(2)} KB</small></span>
            <button className="inline-icon danger" onClick={() => setConfirm(slice)} aria-label={`Clear ${slice}`}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!confirm}
        title={`Clear "${confirm}" data?`}
        text="This slice will be reset to defaults. The change applies after reload."
        danger
        confirmLabel="Clear"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) resetSlice(confirm);
          setConfirm(null);
          setTick((t) => t + 1);
        }}
      />
      <p className="sim-note" style={{ padding: 14 }}>
        Storage is measured from this browser's LocalStorage. Clearing a slice restores its default
        data on next launch.
      </p>
    </SectionShell>
  );
}

// ── Security ─────────────────────────────────────────────────
export function SecuritySection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const showToast = useOS((s) => s.showToast);
  const [pinFlow, setPinFlow] = useState<'set' | 'change' | 'remove' | null>(null);
  const [step, setStep] = useState(1);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const launcher = useOS((s) => s.launcher);
  const patchLauncher = useOS((s) => s.patchLauncher);

  const digit = (d: string) => {
    const target = step === 1 ? a : b;
    const setTarget = step === 1 ? setA : setB;
    if (d === 'c') { setTarget(''); return; }
    if (target.length >= 6) return;
    const next = target + d;
    setTarget(next);
    if (next.length >= 4) {
      if (step === 1) setStep(2);
      else if (a === next) {
        patch({ pin: pinFlow === 'remove' ? null : next });
        showToast(pinFlow === 'remove' ? 'PIN removed' : 'PIN saved');
        setPinFlow(null);
        setStep(1);
        setA('');
        setB('');
      } else {
        showToast('PINs do not match — try again');
        setStep(1);
        setA('');
        setB('');
      }
    }
  };

  const privateSpace = launcher.hidden.includes('essential');

  return (
    <SectionShell title="Security & privacy" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row
          icon={<Lock size={17} />}
          label="Screen lock PIN"
          sub={sys.pin ? `PIN set (${sys.pin.length} digits)` : 'Not set — swipe to unlock'}
          onClick={() => { setPinFlow(sys.pin ? 'change' : 'set'); setStep(1); setA(''); setB(''); }}
        />
        {sys.pin && (
          <Row
            icon={<Trash2 size={16} />}
            label="Remove PIN"
            danger
            onClick={() => {
              patch({ pin: null });
              showToast('PIN removed');
            }}
          />
        )}
        <Row
          icon={<Shield size={16} />}
          label="Private Space"
          sub={privateSpace ? 'Essential Space hidden' : 'Hides Essential Space from launcher'}
          right={
            <Switch
              on={privateSpace}
              onChange={(v) =>
                patchLauncher({
                  hidden: v ? [...launcher.hidden, 'essential'] : launcher.hidden.filter((x) => x !== 'essential'),
                })
              }
            />
          }
        />
      </div>
      <P>App lock (requires a screen-lock PIN)</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        {APP_REGISTRY.map((a) => (
          <Row
            key={a.id}
            icon={<span className="icon-tile" style={{ width: 32, height: 32, background: a.tile }}><a.Icon size={17} /></span>}
            label={a.name}
            right={
              <Switch
                on={sys.lockedApps.includes(a.id)}
                onChange={(v) => {
                  if (v && !sys.pin) {
                    showToast('Set a screen-lock PIN first');
                    return;
                  }
                  patch({
                    lockedApps: v
                      ? [...sys.lockedApps, a.id]
                      : sys.lockedApps.filter((x) => x !== a.id),
                  });
                }}
              />
            }
          />
        ))}
      </div>

      <P>Permission controls (simulated)</P>
      <div className="n-list-group" style={{ margin: '0 12px 12px' }}>
        {['Camera', 'Microphone', 'Location', 'Storage'].map((p, i) => (
          <Row key={p} icon={<Shield size={15} />} label={p} sub={i < 2 ? 'Requested by Camera / Recorder' : 'Browser only'} />
        ))}
      </div>
      <p className="sim-note" style={{ padding: 14 }}>
        <Shield size={12} /> The PIN is a demo lock for the simulated device — it is not a security
        boundary and must never be used to protect real data. The web app cannot access any real
        phone hardware.
      </p>

      <Sheet open={!!pinFlow} onClose={() => setPinFlow(null)} title={pinFlow === 'remove' ? 'Remove PIN' : step === 1 ? 'Create a 4–6 digit PIN' : 'Confirm PIN'}>
        <div className="pin-dots" style={{ position: 'static', margin: '10px 0 20px' }}>
          {Array.from({ length: (step === 1 ? a : b).length || 4 }).map((_, i) => (
            <span key={i} className={i < (step === 1 ? a : b).length ? 'filled' : ''} />
          ))}
        </div>
        <div className="pin-keys" style={{ position: 'static' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', '0', ''].map((k) => (
            <button key={k || 'e'} disabled={!k} onClick={() => k && digit(k)}>{k === 'c' ? 'Clear' : k}</button>
          ))}
        </div>
      </Sheet>
    </SectionShell>
  );
}

// ── Glyph ────────────────────────────────────────────────────
export function GlyphSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  return (
    <SectionShell title="Glyph Interface" onBack={onBack}>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Sparkles size={17} />} label="Glyph Interface" right={<Switch on={sys.glyphEnabled} onChange={(v) => patch({ glyphEnabled: v })} />} />
        <Row icon={<Monitor size={16} />} label="Glyph clock" right={<Switch on={sys.glyphClock} onChange={(v) => patch({ glyphClock: v })} />} />
      </div>
      <P>Effect</P>
      <div className="glyph-effect-grid" style={{ padding: '0 14px' }}>
        {(['pulse', 'wave', 'ripple', 'meter', 'matrix', 'off'] as const).map((e) => (
          <button key={e} className={`chip ${sys.glyphEffect === e ? 'active' : ''}`} onClick={() => patch({ glyphEffect: e })}>
            {e}
          </button>
        ))}
      </div>
      <P>Intensity · {sys.glyphIntensity}%</P>
      <div style={{ padding: '4px 18px' }}><Slider value={sys.glyphIntensity} onChange={(v) => patch({ glyphIntensity: v })} /></div>
      <P>Glyph Timer</P>
      <div className="glyph-timer-row" style={{ padding: '0 14px 16px' }}>
        {[5, 10, 25, 60].map((m) => (
          <button key={m} className="chip" onClick={() => patch({ glyphTimer: m })}>{m} min</button>
        ))}
      </div>
      <div style={{ padding: 12 }}>
        <button className="n-btn accent" style={{ width: '100%' }} onClick={() => patch({ showBackView: true })}>
          <Sparkles size={16} /> Open back view
        </button>
      </div>
    </SectionShell>
  );
}

// ── System ───────────────────────────────────────────────────
export function SystemSection({ onBack }: SectionProps) {
  const sys = useOS((s) => s.system);
  const patch = useOS((s) => s.patchSystem);
  const showToast = useOS((s) => s.showToast);
  const [resetOpen, setResetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkUpdate = () => {
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      showToast('Your system is up to date (Nothing OS 5.0)');
    }, 1600);
  };

  const doExport = () => {
    const blob = new Blob([exportAllData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nothing-phone3-backup.json';
    a.click();
  };
  const doImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      file.text().then((txt) => {
        if (importAllData(txt)) {
          showToast('Data imported — reloading…');
          setTimeout(() => location.reload(), 900);
        } else {
          showToast('Import failed: invalid backup file');
        }
      });
    };
    input.click();
  };

  return (
    <SectionShell title="System" onBack={onBack}>
      <P>Language</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {['English', 'Svenska', 'Deutsch', 'فارسی'].map((l) => (
          <Row
            key={l}
            icon={<Type size={15} />}
            label={l}
            right={sys.language === l ? <Check size={17} color="var(--accent)" /> : undefined}
            onClick={() => patch({ language: l })}
          />
        ))}
      </div>
      <P>Date & time</P>
      <div className="n-list-group" style={{ margin: 12 }}>
        <Row icon={<Timer size={16} />} label="Automatic date & time" sub="Provided by your browser" />
      </div>
      <P>Backup & reset</P>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        <Row icon={<Download size={16} />} label="Export simulator data" onClick={doExport} />
        <Row icon={<Upload size={16} />} label="Import simulator data" onClick={doImport} />
        <Row icon={<RefreshCw size={16} />} label="Check for system update" onClick={checkUpdate} right={updating ? <RefreshCw size={16} className="animate-spin-slow" /> : undefined} />
        <Row icon={<Trash2 size={16} />} label="Reset simulator" danger onClick={() => setResetOpen(true)} />
      </div>
      <ConfirmDialog
        open={resetOpen}
        title="Reset everything?"
        text="All simulator data (settings, messages, accounting, browser data…) will be erased. This cannot be undone."
        danger
        confirmLabel="Reset all"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetAllSlices();
          location.reload();
        }}
      />
    </SectionShell>
  );
}

// ── About ────────────────────────────────────────────────────
export function AboutSection({ onBack }: SectionProps) {
  const specs: [string, string][] = [
    ['Device name', 'Nothing Phone (3)'],
    ['Model', 'A059p'],
    ['Operating system', 'Nothing OS 5.0 (simulated, Android 15 base)'],
    ['Display', '6.67" 1.5K AMOLED · 120Hz · 2772×1284'],
    ['Processor', 'Snapdragon 8s Gen 3 (simulated)'],
    ['Memory', '12 GB RAM · 256 GB storage (simulated)'],
    ['Rear camera', '50 MP + 50 MP + 48 MP periscope'],
    ['Front camera', '32 MP centered punch-hole'],
    ['Battery', '5000 mAh · 50W wired · 15W wireless'],
    ['Build number', 'NP3-5.0.0-sim'],
    ['Kernel', 'Linux 6.1 (virtual)'],
    ['IMEI', '35-000000-000000 (demo)'],
  ];
  return (
    <SectionShell title="About phone" onBack={onBack}>
      <div className="about-hero">
        <span className="about-logo dot-matrix" />
        <strong>Nothing Phone (3)</strong>
        <small>Nothing OS 5.0 · Web Simulator 1.0</small>
      </div>
      <div className="n-list-group" style={{ margin: 12 }}>
        {specs.map(([k, v]) => (
          <div className="n-list-row" key={k}>
            <span className="row-text"><span>{k}</span><small>{v}</small></span>
          </div>
        ))}
      </div>
      <p className="sim-note" style={{ padding: 14 }}>
        <Info size={12} /> Specifications reflect the publicly announced Nothing Phone (3). Hardware
        values inside the simulator are illustrative; no hardware is accessed by this web app.
      </p>
    </SectionShell>
  );
}
