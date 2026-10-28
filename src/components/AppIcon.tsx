import type { PointerEvent as RPointerEvent } from 'react';
import { useRef } from 'react';
import { X } from 'lucide-react';
import { getApp } from '../os/registry';
import { useOS } from '../os/store';
import { haptic } from '../os/hooks';
import './AppIcon.css';

interface Props {
  appId: string;
  showLabel?: boolean;
  editMode?: boolean;
  onRemove?: (appId: string) => void;
  onLongPress?: (appId: string, e: RPointerEvent) => void;
  onOpen?: (appId: string) => void;
  slotAttr?: string;
  dragging?: boolean;
}

export default function AppIcon({
  appId,
  showLabel = true,
  editMode,
  onRemove,
  onLongPress,
  onOpen,
  slotAttr,
  dragging,
}: Props) {
  const app = getApp(appId);
  const iconSize = useOS((s) => s.system.iconSize);
  const openApp = useOS((s) => s.openApp);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const px = 52 + (iconSize - 3) * 5;

  const handleDown = (e: RPointerEvent) => {
    if (editMode) return;
    timer.current = setTimeout(() => {
      haptic(25);
      onLongPress?.(appId, e);
      timer.current = null;
    }, 480);
  };
  const handleUp = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      if (!editMode) (onOpen ?? openApp)(appId);
    }
  };
  const handleMove = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <div
      className={`app-icon-wrap ${dragging ? 'dragging' : ''} ${editMode ? 'jiggle' : ''}`}
      data-slot={slotAttr}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerMove={handleMove}
      onPointerLeave={handleMove}
    >
      <div
        className="icon-tile app-icon-tile"
        style={{ width: px, height: px, background: app.tile, boxShadow: '0 4px 14px rgba(0,0,0,.35)' }}
      >
        <app.Icon size={px * 0.58} />
      </div>
      {showLabel && <span className="app-icon-label">{app.name}</span>}
      {editMode && onRemove && (
        <button
          className="app-icon-x"
          onPointerUp={(e) => {
            e.stopPropagation();
            onRemove(appId);
          }}
          aria-label={`Remove ${app.name}`}
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
