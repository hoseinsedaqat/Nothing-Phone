import { useEffect, useRef, useState } from 'react';
import { Plus, Play, Pause, RotateCcw, Bell, Trash2, Globe, Timer, AlarmClock } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { useNow, formatTime } from '../../os/hooks';
import { Sheet, ConfirmDialog, EmptyState, Switch } from '../../components/ui';
import { uid } from '../../os/storage';
import './ClockApp.css';

type Tab = 'alarm' | 'world' | 'stopwatch' | 'timer';

const WORLD_CITIES = [
  { name: 'Stockholm', tz: 'Europe/Stockholm' },
  { name: 'London', tz: 'Europe/London' },
  { name: 'New York', tz: 'America/New_York' },
  { name: 'Tokyo', tz: 'Asia/Tokyo' },
  { name: 'Sydney', tz: 'Australia/Sydney' },
];

export default function ClockApp() {
  const [tab, setTab] = useState<Tab>('alarm');
  return (
    <div className="clock-app app-chrome">
      <header className="app-header">
        <h1>Clock</h1>
      </header>
      <div className="app-body app-scroll clock-body">
        {tab === 'alarm' && <Alarms />}
        {tab === 'world' && <WorldClock />}
        {tab === 'stopwatch' && <Stopwatch />}
        {tab === 'timer' && <TimerView />}
      </div>
      <nav className="clock-tabs">
        {([
          ['alarm', AlarmClock, 'Alarm'],
          ['world', Globe, 'World'],
          ['stopwatch', Play, 'Stopwatch'],
          ['timer', Timer, 'Timer'],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Alarms() {
  const alarms = useData((s) => s.alarms);
  const patch = useData((s) => s.patch);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Alarm');
  const [toDelete, setToDelete] = useState<string | null>(null);
  const pushNotification = useOS((s) => s.pushNotification);

  const add = () => {
    patch('alarms', [...alarms, { id: uid(), time, label, enabled: true, days: [] }]);
    setOpen(false);
    setLabel('Alarm');
  };

  // Fire alarms whose time matches current minute
  const now = useNow(30_000);
  const fired = useRef<Set<string>>(new Set());
  useEffect(() => {
    const hm = formatTime(now);
    alarms
      .filter((a) => a.enabled && a.time === hm && !fired.current.has(a.id + now.toDateString()))
      .forEach((a) => {
        fired.current.add(a.id + now.toDateString());
        pushNotification({ appId: 'clock', title: a.label, text: `Alarm · ${a.time}`, ongoing: true });
      });
  }, [now, alarms, pushNotification]);

  return (
    <div>
      {alarms.length === 0 && (
        <EmptyState icon={<Bell size={26} />} title="No alarms" text="Add an alarm to get notified at the right moment." />
      )}
      <div className="n-list-group">
        {alarms.map((a) => (
          <div className="n-list-row" key={a.id}>
            <span className="row-text">
              <span className="alarm-time">{a.time}</span>
              <small>
                {a.label}
                {a.days.length ? ` · ${a.days.map((i) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]).join(' ')}` : ''}
                {` · ${a.enabled ? 'On' : 'Off'}`}
              </small>
            </span>
            <Switch on={a.enabled} onChange={(v) => patch('alarms', alarms.map((x) => (x.id === a.id ? { ...x, enabled: v } : x)))} />
            <button className="inline-icon" onClick={() => setToDelete(a.id)} aria-label="Delete alarm">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="fab" onClick={() => setOpen(true)} aria-label="Add alarm">
        <Plus size={24} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="New alarm">
        <input type="time" className="n-input" value={time} onChange={(e) => setTime(e.target.value)} />
        <input
          className="n-input"
          style={{ marginTop: 10 }}
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="n-btn accent" style={{ width: '100%', marginTop: 14 }} onClick={add}>
          Save alarm
        </button>
      </Sheet>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete alarm?"
        text="This alarm will be permanently removed."
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          patch('alarms', alarms.filter((a) => a.id !== toDelete));
          setToDelete(null);
        }}
      />
    </div>
  );
}

function WorldClock() {
  const now = useNow(1000);
  return (
    <div className="n-list-group">
      {WORLD_CITIES.map((c) => (
        <div className="n-list-row" key={c.name}>
          <span className="row-text">
            <span>{c.name}</span>
            <small>{c.tz.split('/')[1].replace('_', ' ')}</small>
          </span>
          <strong className="world-time">
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: c.tz, hour12: false })}
          </strong>
        </div>
      ))}
    </div>
  );
}

function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - ms;
    const t = setInterval(() => setMs(Date.now() - start), 31);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line
  const fmt = (v: number) => {
    const m = Math.floor(v / 60000);
    const s = Math.floor((v % 60000) / 1000);
    const cs = Math.floor((v % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  return (
    <div className="stopwatch">
      <div className="sw-display">{fmt(ms)}</div>
      <div className="sw-buttons">
        <button className="n-btn" onClick={() => { setMs(0); setLaps([]); }}>
          <RotateCcw size={16} /> Reset
        </button>
        <button className="n-btn accent" onClick={() => setRunning(!running)}>
          {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start'}
        </button>
        <button className="n-btn" onClick={() => running && setLaps((l) => [ms, ...l])} disabled={!running}>
          Lap
        </button>
      </div>
      <div className="sw-laps app-scroll">
        {laps.map((lap, i) => (
          <div key={i} className="sw-lap">
            <span>Lap {laps.length - i}</span>
            <strong>{fmt(lap)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerView() {
  const [total, setTotal] = useState(5 * 60);
  const [left, setLeft] = useState<number | null>(null);
  const pushNotification = useOS((s) => s.pushNotification);
  useEffect(() => {
    if (left == null) return;
    if (left <= 0) {
      setLeft(null);
      pushNotification({ appId: 'clock', title: 'Timer finished', text: 'Your countdown timer reached zero.', ongoing: true });
      return;
    }
    const t = setTimeout(() => setLeft((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [left, pushNotification]);
  const mm = Math.floor((left ?? total) / 60);
  const ss = (left ?? total) % 60;
  return (
    <div className="stopwatch">
      <div className="sw-display">
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </div>
      <div className="timer-presets">
        {[1, 5, 10, 25].map((m) => (
          <button key={m} className="chip" onClick={() => { setTotal(m * 60); setLeft(null); }}>
            {m} min
          </button>
        ))}
      </div>
      <div className="sw-buttons">
        <button className="n-btn" onClick={() => setLeft(null)}>
          <RotateCcw size={16} /> Reset
        </button>
        <button className="n-btn accent" onClick={() => setLeft(left == null ? total : left)}>
          <Play size={16} /> Start
        </button>
      </div>
    </div>
  );
}
