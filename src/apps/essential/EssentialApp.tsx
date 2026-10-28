import { useMemo, useState } from 'react';
import { Plus, Pin, Trash2, Search, X, NotebookPen } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { AppChrome, EmptyState, ConfirmDialog } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { Note } from '../../os/types';
import './EssentialApp.css';

const COLORS = ['#D71921', '#2f7cf6', '#30b455', '#8b5cf6', '#f2711c', '#5b6b7a'];

export default function EssentialApp() {
  const { current, push, pop } = useScreenStack('list');
  const notes = useData((s) => s.notes);
  const patch = useData((s) => s.patch);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...notes]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }, [notes, query]);

  const editing = notes.find((n) => n.id === editingId) ?? null;

  const create = () => {
    const note: Note = { id: uid(), title: '', body: '', color: COLORS[notes.length % COLORS.length], pinned: false, updatedAt: Date.now() };
    patch('notes', [note, ...notes]);
    setEditingId(note.id);
    push('editor');
  };

  const update = (id: string, p: Partial<Note>) =>
    patch('notes', useData.getState().notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: Date.now() } : n)));

  if (current.screen === 'editor' && editing) {
    return (
      <div className="note-editor">
        <header className="app-header">
          <button className="app-header-btn" onClick={pop} aria-label="Back">‹</button>
          <h1>Note</h1>
          <button
            className="app-header-btn"
            onClick={() => update(editing.id, { pinned: !editing.pinned })}
            aria-label="Pin"
          >
            <Pin size={17} color={editing.pinned ? 'var(--accent)' : undefined} fill={editing.pinned ? 'currentColor' : 'none'} />
          </button>
        </header>
        <input
          className="note-title-input"
          placeholder="Title"
          value={editing.title}
          onChange={(e) => update(editing.id, { title: e.target.value })}
        />
        <textarea
          className="note-body-input app-scroll"
          placeholder="Write anything…"
          value={editing.body}
          onChange={(e) => update(editing.id, { body: e.target.value })}
        />
        <div className="note-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${editing.color === c ? 'on' : ''}`}
              style={{ background: c }}
              onClick={() => update(editing.id, { color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppChrome
      title="Essential Space"
      actions={<button className="app-header-btn" onClick={create} aria-label="New note"><Plus size={21} /></button>}
    >
      <div className="contacts-search">
        <Search size={15} />
        <input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')}><X size={14} /></button>}
      </div>
      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={26} />}
          title="Your space is empty"
          text="Capture ideas, checklists and private notes. Everything stays in this browser."
          action={<button className="n-btn accent" onClick={create}><Plus size={16} /> New note</button>}
        />
      ) : (
        <div className="notes-grid">
          {filtered.map((n) => (
            <button key={n.id} className="note-card n-card" onClick={() => { setEditingId(n.id); push('editor'); }}>
              <span className="note-accent" style={{ background: n.color }} />
              {n.pinned && <Pin size={12} className="note-pin" fill="currentColor" />}
              <strong>{n.title || 'Untitled'}</strong>
              <p>{n.body || 'No additional text'}</p>
              <small>{new Date(n.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small>
              <span
                className="note-del"
                role="button"
                aria-label="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  setToDelete(n.id);
                }}
              >
                <Trash2 size={14} />
              </span>
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete note?"
        text="This note will be permanently removed."
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          patch('notes', notes.filter((n) => n.id !== toDelete));
          setToDelete(null);
        }}
      />
    </AppChrome>
  );
}
