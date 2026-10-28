import { useMemo, useState } from 'react';
import {
  Folder, FileText, File, ChevronLeft, Plus, Trash2, Pencil, Download,
  FolderPlus, FilePlus2, HardDrive, X,
} from 'lucide-react';
import { useData } from '../../os/dataStore';
import { AppChrome, EmptyState, Sheet, ConfirmDialog } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { FSNode } from '../../os/types';
import './FilesApp.css';

export default function FilesApp() {
  const { current, push, pop } = useScreenStack('browse');
  const files = useData((s) => s.files);
  const patch = useData((s) => s.patch);
  const [cwd, setCwd] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<FSNode | null>(null);
  const [toDelete, setToDelete] = useState<FSNode | null>(null);

  const children = useMemo(() => files.nodes.filter((n) => n.parentId === cwd), [files, cwd]);
  const crumbs = useMemo(() => {
    const path: FSNode[] = [];
    let cur = files.nodes.find((n) => n.id === cwd) ?? null;
    while (cur) {
      path.unshift(cur);
      cur = files.nodes.find((n) => n.id === cur!.parentId) ?? null;
    }
    return path;
  }, [cwd, files]);

  const totalSize = files.nodes.reduce((acc, n) => acc + (n.size ?? 0), 0);

  const create = (kind: 'folder' | 'file') => {
    if (!name.trim()) return;
    const node: FSNode = {
      id: uid(),
      parentId: cwd,
      name: kind === 'file' && !name.includes('.') ? `${name}.txt` : name,
      kind,
      mime: kind === 'file' ? 'text/plain' : undefined,
      size: kind === 'file' ? 0 : undefined,
      content: kind === 'file' ? '' : undefined,
      createdAt: Date.now(),
    };
    patch('files', { nodes: [...files.nodes, node] });
    setName('');
    setCreateOpen(false);
  };

  const openNode = (n: FSNode) => {
    if (n.kind === 'folder') setCwd(n.id);
    else {
      setEditing(n);
      push('editor');
    }
  };

  const saveFile = (content: string) => {
    if (!editing) return;
    patch('files', {
      nodes: files.nodes.map((n) =>
        n.id === editing.id ? { ...n, content, size: new Blob([content]).size } : n,
      ),
    });
  };

  const remove = (node: FSNode) => {
    const doomed = new Set<string>([node.id]);
    let changed = true;
    while (changed) {
      changed = false;
      files.nodes.forEach((n) => {
        if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {
          doomed.add(n.id);
          changed = true;
        }
      });
    }
    patch('files', { nodes: files.nodes.filter((n) => !doomed.has(n.id)) });
    if (node.kind === 'folder' && crumbs.some((c) => c.id === node.id)) setCwd(node.parentId);
  };

  if (current.screen === 'editor' && editing) {
    return <TextEditor node={editing} onBack={pop} onSave={saveFile} />;
  }

  return (
    <AppChrome
      title="Files"
      actions={<button className="app-header-btn" onClick={() => setCreateOpen(true)} aria-label="New"><Plus size={21} /></button>}
    >
      <div className="files-storage n-card">
        <HardDrive size={18} />
        <div className="files-storage-text">
          <strong>{(totalSize / 1024).toFixed(1)} KB used</strong>
          <small>{files.nodes.length} items in virtual storage</small>
        </div>
      </div>

      <div className="crumbs">
        <button className={cwd === null ? 'active' : ''} onClick={() => setCwd(null)}>Internal storage</button>
        {crumbs.map((c) => (
          <span key={c.id} className="crumb">
            / <button onClick={() => setCwd(c.id)}>{c.name}</button>
          </span>
        ))}
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon={<Folder size={26} />}
          title="This folder is empty"
          text="Create a folder or a text file using the + button."
          action={<button className="n-btn accent" onClick={() => setCreateOpen(true)}><Plus size={15} /> New item</button>}
        />
      ) : (
        <div className="n-list-group" style={{ margin: '0 16px' }}>
          {children.map((n) => (
            <div className="n-list-row" key={n.id}>
              <button className="files-open" onClick={() => openNode(n)}>
                <span className="row-icon">{n.kind === 'folder' ? <Folder size={17} /> : n.mime?.includes('pdf') ? <File size={17} /> : <FileText size={17} />}</span>
                <span className="row-text">
                  <span>{n.name}</span>
                  <small>{n.kind === 'folder' ? 'Folder' : `${n.size ?? 0} bytes · ${n.mime ?? 'file'}`}</small>
                </span>
              </button>
              {n.kind === 'file' && (
                <button
                  className="inline-icon"
                  onClick={() => {
                    const blob = new Blob([n.content ?? ''], { type: n.mime ?? 'text/plain' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = n.name;
                    a.click();
                  }}
                  aria-label="Download"
                >
                  <Download size={15} />
                </button>
              )}
              <button className="inline-icon" onClick={() => setToDelete(n)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New item">
        <input className="n-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="create-row">
          <button className="n-btn" disabled={!name.trim()} onClick={() => create('folder')}><FolderPlus size={16} /> Folder</button>
          <button className="n-btn accent" disabled={!name.trim()} onClick={() => create('file')}><FilePlus2 size={16} /> Text file</button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.kind === 'folder' ? 'folder' : 'file'}?`}
        text={toDelete?.kind === 'folder' ? 'The folder and all of its contents will be removed.' : 'This item will be permanently deleted.'}
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete);
          setToDelete(null);
        }}
      />
    </AppChrome>
  );
}

function TextEditor({ node, onBack, onSave }: { node: FSNode; onBack: () => void; onSave: (c: string) => void }) {
  const [text, setText] = useState(node.content ?? '');
  return (
    <div className="text-editor">
      <header className="app-header">
        <button className="app-header-btn" onClick={onBack}><ChevronLeft size={22} /></button>
        <h1>{node.name}</h1>
        <button
          className="app-header-btn"
          onClick={() => {
            onSave(text);
          }}
          aria-label="Save"
        >
          <Pencil size={17} />
        </button>
      </header>
      <textarea
        className="editor-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing…"
        spellCheck={false}
      />
      <button
        className="n-btn accent editor-save"
        onClick={() => {
          onSave(text);
        }}
      >
        Save file
      </button>
      <button className="editor-x" onClick={onBack} aria-label="Close"><X size={18} /></button>
    </div>
  );
}
