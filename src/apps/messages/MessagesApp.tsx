import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronLeft, Send, Trash2, MessageSquare, Search, X } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { AppChrome, EmptyState, Sheet, ConfirmDialog } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { Thread } from '../../os/types';
import './MessagesApp.css';

const REPLIES = ['Got it! 👍', 'Sounds good.', 'Haha, nice one', 'Let me check and get back to you.', 'Perfect, talk soon!'];

export default function MessagesApp() {
  const { current, push, pop } = useScreenStack('list');
  const threads = useData((s) => s.threads);
  const patch = useData((s) => s.patch);
  const contacts = useData((s) => s.contacts);
  const addMessage = useData((s) => s.addMessage);
  const pushNotification = useOS((s) => s.pushNotification);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === threadId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length, current.screen]);

  const openThread = (id: string) => {
    setThreadId(id);
    push('thread');
  };

  const send = (text: string) => {
    if (!thread || !text.trim()) return;
    addMessage(thread.id, { fromMe: true, text: text.trim() });
    setTimeout(() => {
      const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
      addMessage(thread.id, { fromMe: false, text: reply });
      if (useOS.getState().activeAppId !== 'messages') {
        pushNotification({ appId: 'messages', title: thread.title, text: reply });
      }
    }, 1400 + Math.random() * 900);
  };

  if (current.screen === 'thread' && thread) {
    return <Conversation thread={thread} onBack={pop} onSend={send} bottomRef={bottomRef} />;
  }

  const filtered = threads.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppChrome
      title="Messages"
      actions={<button className="app-header-btn" onClick={() => setNewOpen(true)} aria-label="New message"><Plus size={21} /></button>}
    >
      <div className="contacts-search">
        <Search size={15} />
        <input placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')}><X size={14} /></button>}
      </div>
      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={26} />}
          title="No conversations"
          text="Start a new simulated conversation with any contact."
          action={<button className="n-btn accent" onClick={() => setNewOpen(true)}><Plus size={16} /> New message</button>}
        />
      ) : (
        <div className="n-list-group" style={{ margin: 14 }}>
          {filtered.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <button key={t.id} className="n-list-row msg-row" onClick={() => openThread(t.id)}>
                <span className="contact-avatar">{t.title.slice(0, 2).toUpperCase()}</span>
                <span className="row-text">
                  <span>{t.title}</span>
                  <small>
                    {last ? `${last.fromMe ? 'You: ' : ''}${last.text}` : 'No messages'} ·{' '}
                    {new Date(last?.at ?? 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </span>
                <button
                  className="inline-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToDelete(t.id);
                  }}
                  aria-label="Delete conversation"
                >
                  <Trash2 size={15} />
                </button>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New conversation">
        {contacts.map((c) => (
          <button
            key={c.id}
            className="n-list-row"
            style={{ width: '100%' }}
            onClick={() => {
              const existing = threads.find((t) => t.address === c.phone);
              if (existing) {
                setNewOpen(false);
                openThread(existing.id);
                return;
              }
              const t: Thread = { id: uid(), contactId: c.id, address: c.phone, title: c.name, messages: [] };
              patch('threads', [...useData.getState().threads, t]);
              setNewOpen(false);
              openThread(t.id);
            }}
          >
            <span className="contact-avatar" style={{ background: c.color }}>
              {c.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="row-text"><span>{c.name}</span><small>{c.phone}</small></span>
          </button>
        ))}
        <button
          className="n-list-row"
          style={{ width: '100%' }}
          onClick={() => {
            const num = prompt('Enter a phone number:');
            if (!num) return;
            const t: Thread = { id: uid(), contactId: null, address: num, title: num, messages: [] };
            patch('threads', [...useData.getState().threads, t]);
            setNewOpen(false);
            openThread(t.id);
          }}
        >
          <span className="row-icon"><Plus size={16} /></span>
          <span className="row-text"><span>Type a number</span></span>
        </button>
      </Sheet>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete conversation?"
        text="All messages in this conversation will be removed."
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          patch('threads', threads.filter((t) => t.id !== toDelete));
          setToDelete(null);
        }}
      />
    </AppChrome>
  );
}

function Conversation({
  thread,
  onBack,
  onSend,
  bottomRef,
}: {
  thread: Thread;
  onBack: () => void;
  onSend: (t: string) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  const [text, setText] = useState('');
  return (
    <div className="conversation">
      <header className="app-header">
        <button className="app-header-btn" onClick={onBack}><ChevronLeft size={22} /></button>
        <h1>{thread.title}</h1>
      </header>
      <div className="msg-list app-scroll">
        {thread.messages.length === 0 && <p className="msg-empty">Send the first message — replies are simulated.</p>}
        {thread.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.fromMe ? 'me' : 'them'}`}>
            <p>{m.text}</p>
            <time>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="msg-input"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(text);
          setText('');
        }}
      >
        <input
          value={text}
          placeholder="Message"
          onChange={(e) => setText(e.target.value)}
          aria-label="Message text"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
