import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Star, Phone, MessageCircle, Trash2, Pencil, ChevronLeft, X, User } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { AppChrome, EmptyState, Sheet, ConfirmDialog } from '../../components/ui';
import { useScreenStack, haptic } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { Contact } from '../../os/types';
import './ContactsApp.css';

const COLORS = ['#D71921', '#2f7cf6', '#30b455', '#8b5cf6', '#f2711c', '#5b6b7a'];

export default function ContactsApp() {
  const { current, push, pop } = useScreenStack('list');
  const contacts = useData((s) => s.contacts);
  const patch = useData((s) => s.patch);
  const openApp = useOS((s) => s.openApp);
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: Event) => {
      setDetailId((e as CustomEvent).detail as string);
      push('detail');
    };
    window.addEventListener('os-open-contact', h);
    return () => window.removeEventListener('os-open-contact', h);
  }, [push]);

  const filtered = useMemo(() => {
    let list = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    if (favOnly) list = list.filter((c) => c.favorite);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    return list;
  }, [contacts, query, favOnly]);

  const detail = contacts.find((c) => c.id === detailId) ?? null;

  const save = (c: Contact) => {
    const exists = contacts.some((x) => x.id === c.id);
    patch('contacts', exists ? contacts.map((x) => (x.id === c.id ? c : x)) : [...contacts, c]);
    setCreating(false);
    setEditing(null);
    haptic(12);
  };

  if (current.screen === 'detail' && detail) {
    return (
      <div className="contacts-detail">
        <header className="app-header">
          <button className="app-header-btn" onClick={pop}><ChevronLeft size={22} /></button>
          <h1>Contact</h1>
          <button className="app-header-btn" onClick={() => setEditing(detail)} aria-label="Edit"><Pencil size={17} /></button>
        </header>
        <div className="app-body app-scroll">
          <div className="contact-hero">
            <span className="contact-avatar big" style={{ background: detail.color }}>
              {detail.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </span>
            <h2>{detail.name}</h2>
            <button
              className={`fav-star ${detail.favorite ? 'on' : ''}`}
              onClick={() => patch('contacts', contacts.map((c) => (c.id === detail.id ? { ...c, favorite: !c.favorite } : c)))}
            >
              <Star size={18} fill={detail.favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="n-list-group">
            <div className="n-list-row"><Phone size={17} className="row-accent" /><span className="row-text"><span>{detail.phone}</span><small>Mobile</small></span></div>
            <div className="n-list-row"><User size={17} className="row-accent" /><span className="row-text"><span>{detail.email || 'No email'}</span><small>Email</small></span></div>
          </div>
          <div className="contact-actions">
            <button className="n-btn accent" onClick={() => openApp('phone')}>
              <Phone size={16} /> Call
            </button>
            <button className="n-btn" onClick={() => openApp('messages')}>
              <MessageCircle size={16} /> Message
            </button>
            <button
              className="n-btn danger"
              onClick={() => {
                patch('contacts', contacts.filter((c) => c.id !== detail.id));
                pop();
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
        {editing && <ContactEditor contact={editing} onClose={() => setEditing(null)} onSave={save} />}
      </div>
    );
  }

  return (
    <AppChrome
      title="Contacts"
      actions={<button className="app-header-btn" onClick={() => setCreating(true)} aria-label="Add contact"><Plus size={21} /></button>}
    >
      <div className="contacts-search">
        <Search size={15} />
        <input placeholder="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')}><X size={14} /></button>}
      </div>
      <div className="contacts-filters">
        <button className={`chip ${favOnly ? 'active' : ''}`} onClick={() => setFavOnly(!favOnly)}>
          <Star size={12} /> Favorites
        </button>
        <span className="contacts-count">{filtered.length} contacts</span>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={<User size={26} />}
          title="No contacts"
          text="Add your first contact to call or message them quickly."
          action={<button className="n-btn accent" onClick={() => setCreating(true)}><Plus size={16} /> Add contact</button>}
        />
      ) : (
        <div className="n-list-group contacts-list">
          {filtered.map((c) => (
            <button
              key={c.id}
              className="n-list-row"
              onClick={() => {
                setDetailId(c.id);
                push('detail');
              }}
            >
              <span className="contact-avatar" style={{ background: c.color }}>
                {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
              <span className="row-text">
                <span>{c.name}</span>
                <small>{c.phone}</small>
              </span>
              {c.favorite && <Star size={14} className="fav-mini" fill="currentColor" />}
            </button>
          ))}
        </div>
      )}

      {creating && (
        <ContactEditor
          contact={{ id: uid(), name: '', phone: '', email: '', favorite: false, color: COLORS[contacts.length % COLORS.length] }}
          onClose={() => setCreating(false)}
          onSave={save}
        />
      )}
    </AppChrome>
  );
}

function ContactEditor({ contact, onClose, onSave }: { contact: Contact; onClose: () => void; onSave: (c: Contact) => void }) {
  const [form, setForm] = useState(contact);
  const valid = form.name.trim() && form.phone.trim();
  return (
    <Sheet open onClose={onClose} title={contact.name ? 'Edit contact' : 'New contact'}>
      <div className="editor-fields">
        <input className="n-input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="n-input" placeholder="Phone number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="n-input" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${form.color === c ? 'on' : ''}`}
              style={{ background: c }}
              onClick={() => setForm({ ...form, color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <button className="n-btn accent" disabled={!valid} style={{ width: '100%' }} onClick={() => valid && onSave(form)}>
          Save contact
        </button>
      </div>
    </Sheet>
  );
}
