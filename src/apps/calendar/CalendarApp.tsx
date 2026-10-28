import { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, CalendarX2 } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { AppChrome, EmptyState, Sheet, ConfirmDialog } from '../../components/ui';
import { uid } from '../../os/storage';
import type { CalEvent } from '../../os/types';
import './CalendarApp.css';

const COLORS = ['#D71921', '#2f7cf6', '#30b455', '#8b5cf6', '#f2711c'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarApp() {
  const events = useData((s) => s.events);
  const patch = useData((s) => s.patch);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(iso(new Date()));
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ title: '', date: selectedDate, start: '10:00', end: '11:00', color: COLORS[0], note: '' });

  const days = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7; // Monday start
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    const count = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= count; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor]);

  const dayEvents = events.filter((e) => e.date === selectedDate).sort((a, b) => a.start.localeCompare(b.start));
  const eventOn = (d: Date) => events.filter((e) => e.date === iso(d));

  const save = () => {
    if (!form.title.trim()) return;
    const ev: CalEvent = { id: uid(), ...form };
    patch('events', [...events, ev]);
    setEditorOpen(false);
    setForm({ ...form, title: '', note: '' });
  };

  return (
    <AppChrome
      title="Calendar"
      actions={<button className="app-header-btn" onClick={() => { setForm({ ...form, date: selectedDate }); setEditorOpen(true); }} aria-label="Add event"><Plus size={21} /></button>}
    >
      <div className="cal-head">
        <button className="app-header-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
        <strong>{cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong>
        <button className="app-header-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={20} /></button>
      </div>
      <div className="cal-grid cal-weekdays">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {days.map((d, i) => {
          if (!d) return <span key={i} className="cal-empty" />;
          const dIso = iso(d);
          const evs = eventOn(d);
          return (
            <button
              key={i}
              className={`cal-day ${dIso === selectedDate ? 'selected' : ''} ${dIso === iso(new Date()) ? 'today' : ''}`}
              onClick={() => setSelectedDate(dIso)}
            >
              {d.getDate()}
              {evs.length > 0 && <span className="cal-dots">{evs.slice(0, 3).map((e) => <i key={e.id} style={{ background: e.color }} />)}</span>}
            </button>
          );
        })}
      </div>

      <p className="n-section-title">{selectedDate} · {dayEvents.length} event(s)</p>
      {dayEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 size={24} />}
          title="No events"
          text="Nothing scheduled for this day."
          action={<button className="n-btn accent" onClick={() => { setForm({ ...form, date: selectedDate }); setEditorOpen(true); }}><Plus size={15} /> Add event</button>}
        />
      ) : (
        <div className="n-list-group" style={{ margin: '0 16px' }}>
          {dayEvents.map((e) => (
            <div className="n-list-row" key={e.id}>
              <span className="event-bar" style={{ background: e.color }} />
              <span className="row-text">
                <span>{e.title}</span>
                <small>{e.start} – {e.end}{e.note ? ` · ${e.note}` : ''}</small>
              </span>
              <button className="inline-icon" onClick={() => setToDelete(e.id)} aria-label="Delete event"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={editorOpen} onClose={() => setEditorOpen(false)} title="New event">
        <div className="editor-fields">
          <input className="n-input" placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="date" className="n-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="time-row">
            <input type="time" className="n-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            <input type="time" className="n-input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <input className="n-input" placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="color-row">
            {COLORS.map((c) => (
              <button key={c} className={`color-dot ${form.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} aria-label={`Color ${c}`} />
            ))}
          </div>
          <button className="n-btn accent" disabled={!form.title.trim()} onClick={save}>Save event</button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete event?"
        text="This event will be removed from your calendar."
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          patch('events', events.filter((e) => e.id !== toDelete));
          setToDelete(null);
        }}
      />
    </AppChrome>
  );
}
