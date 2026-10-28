import { useState } from 'react';
import { Plus, RefreshCw, Wind, Droplets, Thermometer, MapPin, Trash2, ChevronLeft } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { AppChrome, EmptyState, Sheet } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { WeatherCity } from '../../os/types';
import './WeatherApp.css';

const PRESET_POOL: Omit<WeatherCity, 'id'>[] = [
  { name: 'London', temp: 12, condition: 'Rain', humidity: 82, wind: 9, forecast: [
    { day: 'Tue', hi: 13, lo: 8, condition: 'Rain' }, { day: 'Wed', hi: 14, lo: 9, condition: 'Cloudy' },
    { day: 'Thu', hi: 12, lo: 7, condition: 'Rain' }, { day: 'Fri', hi: 15, lo: 9, condition: 'Wind' },
    { day: 'Sat', hi: 14, lo: 8, condition: 'Cloudy' }] },
  { name: 'Tokyo', temp: 19, condition: 'Partly Cloudy', humidity: 60, wind: 4, forecast: [
    { day: 'Tue', hi: 21, lo: 15, condition: 'Sunny' }, { day: 'Wed', hi: 20, lo: 14, condition: 'Cloudy' },
    { day: 'Thu', hi: 18, lo: 13, condition: 'Rain' }, { day: 'Fri', hi: 19, lo: 14, condition: 'Sunny' },
    { day: 'Sat', hi: 22, lo: 16, condition: 'Sunny' }] },
  { name: 'New York', temp: 16, condition: 'Sunny', humidity: 48, wind: 7, forecast: [
    { day: 'Tue', hi: 18, lo: 10, condition: 'Sunny' }, { day: 'Wed', hi: 17, lo: 11, condition: 'Wind' },
    { day: 'Thu', hi: 15, lo: 9, condition: 'Cloudy' }, { day: 'Fri', hi: 16, lo: 10, condition: 'Sunny' },
    { day: 'Sat', hi: 19, lo: 12, condition: 'Sunny' }] },
  { name: 'Sydney', temp: 24, condition: 'Clear', humidity: 55, wind: 5, forecast: [
    { day: 'Tue', hi: 26, lo: 18, condition: 'Sunny' }, { day: 'Wed', hi: 25, lo: 17, condition: 'Partly Cloudy' },
    { day: 'Thu', hi: 23, lo: 16, condition: 'Rain' }, { day: 'Fri', hi: 24, lo: 17, condition: 'Sunny' },
    { day: 'Sat', hi: 27, lo: 19, condition: 'Sunny' }] },
];

export default function WeatherApp() {
  const { current, push, pop } = useScreenStack('list');
  const cities = useData((s) => s.weather);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<WeatherCity | null>(null);

  const refresh = () => {
    patch(
      'weather',
      cities.map((c) => ({ ...c, temp: c.temp + Math.round(Math.random() * 3) - 1 })),
    );
    showToast('Weather updated (simulated)');
  };

  if (current.screen === 'detail' && selected) {
    return (
      <div className="weather-detail">
        <header className="app-header">
          <button className="app-header-btn" onClick={pop}><ChevronLeft size={22} /></button>
          <h1>{selected.name}</h1>
        </header>
        <div className="app-body app-scroll">
          <div className="wd-hero">
            <strong>{selected.temp}°</strong>
            <p>{selected.condition}</p>
          </div>
          <div className="wd-stats">
            <div><Droplets size={16} /><span>Humidity</span><strong>{selected.humidity}%</strong></div>
            <div><Wind size={16} /><span>Wind</span><strong>{selected.wind} m/s</strong></div>
            <div><Thermometer size={16} /><span>Feels like</span><strong>{selected.temp - 1}°</strong></div>
          </div>
          <p className="n-section-title">5-day forecast</p>
          <div className="n-list-group">
            {selected.forecast.map((f) => (
              <div className="n-list-row" key={f.day}>
                <span className="row-text"><span>{f.day}</span><small>{f.condition}</small></span>
                <strong>{f.hi}° / {f.lo}°</strong>
              </div>
            ))}
          </div>
          <button
            className="n-btn danger"
            style={{ width: '100%', marginTop: 18 }}
            onClick={() => {
              patch('weather', cities.filter((c) => c.id !== selected.id));
              pop();
            }}
          >
            <Trash2 size={15} /> Remove city
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppChrome
      title="Weather"
      actions={
        <>
          <button className="app-header-btn" onClick={refresh} aria-label="Refresh"><RefreshCw size={17} /></button>
          <button className="app-header-btn" onClick={() => setAddOpen(true)} aria-label="Add city"><Plus size={20} /></button>
        </>
      }
    >
      {cities.length === 0 && (
        <EmptyState
          icon={<MapPin size={26} />}
          title="No cities yet"
          text="Add a city to see its simulated forecast."
          action={<button className="n-btn accent" onClick={() => setAddOpen(true)}>Add city</button>}
        />
      )}
      <div className="weather-list">
        {cities.map((c) => (
          <button key={c.id} className="weather-card n-card" onClick={() => { setSelected(c); push('detail'); }}>
            <div>
              <strong>{c.name}</strong>
              <p>{c.condition}</p>
            </div>
            <span className="weather-card-temp">{c.temp}°</span>
          </button>
        ))}
      </div>
      <p className="sim-note">Weather data is simulated locally — no live weather service is connected.</p>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add city">
        {PRESET_POOL.filter((p) => !cities.some((c) => c.name === p.name)).map((p) => (
          <button
            key={p.name}
            className="n-list-row"
            style={{ width: '100%' }}
            onClick={() => {
              patch('weather', [...useData.getState().weather, { ...p, id: uid() }]);
              setAddOpen(false);
            }}
          >
            <MapPin size={17} />
            <span className="row-text"><span>{p.name}</span><small>{p.condition} · {p.temp}°</small></span>
          </button>
        ))}
        {PRESET_POOL.every((p) => cities.some((c) => c.name === p.name)) && (
          <p className="sim-note">All available simulated cities have been added.</p>
        )}
      </Sheet>
    </AppChrome>
  );
}
