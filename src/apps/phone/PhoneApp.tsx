import { useEffect, useState } from 'react';
import { Delete, Phone as PhoneIcon, PhoneOff, Clock3, User, ShieldAlert } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { loadSlice, queueSave, uid } from '../../os/storage';
import { EmptyState } from '../../components/ui';
import { playDialTone } from '../../os/sound';
import './PhoneApp.css';

interface CallLogEntry {
  id: string;
  number: string;
  name?: string;
  at: number;
  duration: number;
  direction: 'out' | 'in';
}

export default function PhoneApp() {
  const [tab, setTab] = useState<'keypad' | 'recents'>('keypad');
  const contacts = useData((s) => s.contacts);
  const [log, setLog] = useState<CallLogEntry[]>(() =>
    loadSlice<CallLogEntry[]>('callLog', [
      { id: uid(), number: '+46 70 123 45 67', name: 'Alex Morgan', at: Date.now() - 86400000, duration: 184, direction: 'in' },
    ]),
  );
  const [number, setNumber] = useState('');
  const [calling, setCalling] = useState<CallLogEntry | null>(null);
  const [seconds, setSeconds] = useState(0);
  const showToast = useOS((s) => s.showToast);

  useEffect(() => queueSave('callLog', log), [log]);
  useEffect(() => {
    if (!calling) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [calling]);

  const nameFor = (num: string) => contacts.find((c) => c.phone === num)?.name;

  const startCall = (num: string) => {
    if (!num.trim()) {
      showToast('Enter a number first');
      return;
    }
    setCalling({ id: uid(), number: num, name: nameFor(num), at: Date.now(), duration: 0, direction: 'out' });
    setSeconds(0);
  };
  const endCall = () => {
    if (calling) {
      setLog((l) => [{ ...calling, duration: seconds }, ...l].slice(0, 50));
    }
    setCalling(null);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="phone-app app-chrome">
      <header className="app-header"><h1>Phone</h1></header>
      <div className="app-body app-scroll">
        {tab === 'keypad' ? (
          <div className="dialer">
            <div className="dialer-display">
              <strong>{number || <span className="dialer-placeholder">Dial a number</span>}</strong>
              {number && nameFor(number) && <small>{nameFor(number)}</small>}
            </div>
            <div className="dialer-grid">
              {keys.map((k) => (
                <button key={k} className="dial-key" onClick={() => { playDialTone(k); setNumber((n) => n + k); }}>
                  <strong>{k}</strong>
                  <small>{['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ', '', '+', ''][keys.indexOf(k)]}</small>
                </button>
              ))}
            </div>
            <div className="dialer-actions">
              <span />
              <button className="call-btn" onClick={() => startCall(number)} aria-label="Call">
                <PhoneIcon size={26} />
              </button>
              <button className="del-btn" onClick={() => setNumber((n) => n.slice(0, -1))} aria-label="Delete">
                <Delete size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            {log.length === 0 ? (
              <EmptyState icon={<Clock3 size={26} />} title="No recent calls" text="Calls you make will appear here." />
            ) : (
              <div className="n-list-group" style={{ margin: 14 }}>
                {log.map((c) => (
                  <button key={c.id} className="n-list-row" onClick={() => startCall(c.number)}>
                    <span className="row-icon"><User size={17} /></span>
                    <span className="row-text">
                      <span>{c.name || c.number}</span>
                      <small>
                        {c.direction === 'in' ? '↙ Incoming' : '↗ Outgoing'} · {new Date(c.at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        {c.duration ? ` · ${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')}` : ''}
                      </small>
                    </span>
                    <PhoneIcon size={16} className="row-accent" />
                  </button>
                ))}
              </div>
            )}
            <p className="sim-note"><ShieldAlert size={12} /> Calls are simulated — this web app cannot place real phone calls.</p>
          </div>
        )}
      </div>
      <div className="dialer-tabs">
        <button className={tab === 'keypad' ? 'active' : ''} onClick={() => setTab('keypad')}>Keypad</button>
        <button className={tab === 'recents' ? 'active' : ''} onClick={() => setTab('recents')}>Recents</button>
      </div>

      {calling && (
        <div className="call-screen">
          <div className="call-avatar">
            {(calling.name || calling.number).slice(0, 2).toUpperCase()}
          </div>
          <h2>{calling.name || calling.number}</h2>
          <p className="call-state">
            Simulated {calling.direction === 'in' ? 'incoming' : 'outgoing'} call ·{' '}
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </p>
          <button className="end-call" onClick={endCall} aria-label="End call">
            <PhoneOff size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
