import { CloudSun, Battery, CalendarDays, Clock as ClockIcon } from 'lucide-react';
import { useNow, formatTime } from '../../os/hooks';
import { useOS } from '../../os/store';
import { useData } from '../../os/dataStore';
import DotClock from '../DotClock';
import './Widgets.css';

export function ClockWidget() {
  const now = useNow();
  return (
    <div className="widget widget-clock n-card">
      <ClockIcon size={14} className="widget-glyph" />
      <DotClock value={formatTime(now)} size={42} />
      <div className="widget-sub">
        {now.toLocaleDateString([], { weekday: 'short' })} ·{' '}
        {now.toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

export function WeatherWidget() {
  const city = useData((s) => s.weather[0]);
  if (!city) return null;
  return (
    <div className="widget n-card">
      <CloudSun size={18} className="widget-glyph" />
      <div className="widget-big">{city.temp}°</div>
      <div className="widget-sub">
        {city.name} · {city.condition}
      </div>
      <div className="widget-forecast">
        {city.forecast.slice(0, 3).map((f) => (
          <span key={f.day}>
            {f.day} {f.hi}°
          </span>
        ))}
      </div>
    </div>
  );
}

export function BatteryWidget() {
  const sys = useOS((s) => s.system);
  return (
    <div className="widget n-card">
      <Battery size={18} className="widget-glyph" />
      <div className="widget-big">{sys.batteryLevel}%</div>
      <div className="widget-sub">{sys.batterySaver ? 'Battery Saver on' : 'Battery normal'}</div>
      <div className="widget-bar">
        <span style={{ width: `${sys.batteryLevel}%` }} />
      </div>
    </div>
  );
}

export function CalendarWidget() {
  const now = useNow(60_000);
  const events = useData((s) => s.events);
  const today = now.toISOString().slice(0, 10);
  const todays = events.filter((e) => e.date === today);
  const next = [...events].sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <div className="widget widget-wide n-card">
      <div className="widget-cal-head">
        <CalendarDays size={16} className="widget-glyph" />
        <strong>{now.toLocaleDateString([], { month: 'long' })}</strong>
        <span className="widget-cal-day">{now.getDate()}</span>
      </div>
      {todays[0] ? (
        <p className="widget-event">
          {todays[0].start} · {todays[0].title}
        </p>
      ) : next ? (
        <p className="widget-event muted">
          Next: {next.date} · {next.title}
        </p>
      ) : (
        <p className="widget-event muted">No events — tap + to add one</p>
      )}
    </div>
  );
}

export const WIDGETS = [
  { id: 'clock', name: 'Clock', Component: ClockWidget },
  { id: 'weather', name: 'Weather', Component: WeatherWidget },
  { id: 'battery', name: 'Battery', Component: BatteryWidget },
  { id: 'calendar', name: 'Calendar', Component: CalendarWidget },
];
