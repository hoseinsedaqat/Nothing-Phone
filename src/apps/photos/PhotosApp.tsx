import { useMemo, useState } from 'react';
import { ChevronLeft, Trash2, Download, Image as ImageIcon, ImageOff } from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { AppChrome, EmptyState, ConfirmDialog } from '../../components/ui';
import { useScreenStack } from '../../os/hooks';
import { uid } from '../../os/storage';
import type { PhotoItem } from '../../os/types';
import './PhotosApp.css';

const svgPhoto = (bg: string, fg: string, label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${bg}'/><stop offset='1' stop-color='#000'/></linearGradient></defs><rect width='600' height='900' fill='url(#g)'/><circle cx='300' cy='340' r='130' fill='${fg}' opacity='0.85'/><g fill='#fff' opacity='0.5'>${Array.from({ length: 40 })
      .map(() => `<circle cx='${Math.random() * 600}' cy='${Math.random() * 900}' r='${Math.random() * 4 + 1}'/>`)
      .join('')}</g><text x='50%' y='820' font-family='sans-serif' font-size='26' fill='white' text-anchor='middle' opacity='0.85'>${label}</text></svg>`,
  )}`;

const SEED: PhotoItem[] = [
  { id: uid(), src: svgPhoto('#3d1226', '#d71921', 'Glyph Night'), at: Date.now() - 86400000 * 2, album: 'Camera' },
  { id: uid(), src: svgPhoto('#10243d', '#2f7cf6', 'Stockholm Blue'), at: Date.now() - 86400000, album: 'Camera' },
  { id: uid(), src: svgPhoto('#1d2b16', '#30b455', 'Green Hour'), at: Date.now() - 3600000 * 6, album: 'Downloads' },
];

export default function PhotosApp() {
  const { current, push, pop } = useScreenStack('grid');
  const photos = useData((s) => s.photos);
  const patch = useData((s) => s.patch);
  const patchSystem = useOS((s) => s.patchSystem);
  const showToast = useOS((s) => s.showToast);
  const [album, setAlbum] = useState('All');
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const all = useMemo(() => (photos.length ? photos : SEED), [photos]);
  const albums = ['All', ...Array.from(new Set(all.map((p) => p.album)))];
  const shown = album === 'All' ? all : all.filter((p) => p.album === album);

  const setWallpaper = () => {
    if (!selected) return;
    patchSystem({ customWallpaper: selected.src });
    showToast('Wallpaper updated');
  };

  if (current.screen === 'viewer' && selected) {
    return (
      <div className="photo-viewer">
        <header className="app-header">
          <button className="app-header-btn" onClick={pop}><ChevronLeft size={22} /></button>
          <h1>{selected.album}</h1>
        </header>
        <div className="viewer-stage">
          <img src={selected.src} alt="" />
        </div>
        <div className="viewer-actions">
          <button
            className="n-btn"
            onClick={() => {
              const a = document.createElement('a');
              a.href = selected.src;
              a.download = `nothing-photo-${selected.id}.jpg`;
              a.click();
            }}
          >
            <Download size={16} /> Save
          </button>
          <button className="n-btn" onClick={setWallpaper}>
            <ImageIcon size={16} /> Set wallpaper
          </button>
          <button className="n-btn danger" onClick={() => setConfirmDel(true)}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
        <ConfirmDialog
          open={confirmDel}
          title="Delete photo?"
          text="It will be removed from this device's simulated storage."
          danger
          confirmLabel="Delete"
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => {
            patch('photos', photos.filter((p) => p.id !== selected.id));
            setConfirmDel(false);
            pop();
          }}
        />
      </div>
    );
  }

  return (
    <AppChrome title="Photos">
      <div className="album-chips">
        {albums.map((a) => (
          <button key={a} className={`chip ${album === a ? 'active' : ''}`} onClick={() => setAlbum(a)}>
            {a}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState
          icon={<ImageOff size={26} />}
          title="No photos here"
          text="Photos you take with the Camera appear in this album."
        />
      ) : (
        <div className="photo-grid">
          {shown.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelected(p);
                push('viewer');
              }}
              className="photo-cell"
            >
              <img src={p.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </AppChrome>
  );
}
