import type { FC } from 'react';
import {
  Phone,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  CalendarDays,
  Clock,
  Calculator,
  CloudSun,
  Folder,
  Mic,
  Settings,
  NotebookPen,
  Wallet,
  Store,
  type LucideIcon,
} from 'lucide-react';

export interface AppIconProps {
  size?: number;
  monochrome?: boolean;
}

/** Authentic multicolor Google Chrome mark. */
export const ChromeMark: FC<AppIconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#fff" />
    <path d="M24 4a20 20 0 0 1 17.3 10H24a10 10 0 0 0-9.6 7.1L7.7 9.6A19.9 19.9 0 0 1 24 4Z" fill="#EA4335" />
    <path d="M7.7 9.6 14.4 21a10 10 0 0 0 3.6 13.7l-6.7 11.6A20 20 0 0 1 4 24c0-5.5 2.2-10.5 5.7-14.1Z" fill="#FBBC05" />
    <path d="M24 14l8.7 5a10 10 0 0 1-3.6 18.3L18 44.3A20 20 0 1 0 24 4Z" fill="#34A853" />
    <path d="M24 14a10 10 0 0 1 8.7 5H24a10 10 0 1 0-8.7 15L24 14Z" fill="#4285F4" />
    <circle cx="24" cy="24" r="7" fill="#fff" />
    <circle cx="24" cy="24" r="6" fill="#1A73E8" />
  </svg>
);

/** Google Play Store triangle mark. */
export const PlayMark: FC<AppIconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill="#fff" />
    <path d="M13 9.5 28.5 24 13 38.5a2.6 2.6 0 0 1-1-2V11.5c0-1 .6-1.7 1-2Z" fill="#34A853" />
    <path d="M34 19.8 28.5 24 13 9.5l18.5 9.3a3 3 0 0 1 2.5 1Z" fill="#FBBC05" />
    <path d="M34 28.2 13 38.5 28.5 24l5.5 4.2Z" fill="#EA4335" />
    <path d="M37 22.3 34 19.8 28.5 24l5.5 4.2 3-1.7c1.7-1 1.7-3.4 0-4.2Z" fill="#4285F4" />
  </svg>
);

export const APP_META: Record<
  string,
  { name: string; Mono: LucideIcon; tile: string; Color?: FC<AppIconProps> }
> = {
  phone: { name: 'Phone', Mono: Phone, tile: '#3a3f45' },
  messages: { name: 'Messages', Mono: MessageCircle, tile: '#33404d' },
  chrome: { name: 'Chrome', Mono: ChromeMark as unknown as LucideIcon, tile: '#ffffff', Color: ChromeMark },
  camera: { name: 'Camera', Mono: Camera, tile: '#2b2b2e' },
  photos: { name: 'Photos', Mono: ImageIcon, tile: '#3d3438' },
  contacts: { name: 'Contacts', Mono: Phone, tile: '#34383d' },
  calendar: { name: 'Calendar', Mono: CalendarDays, tile: '#3c3032' },
  clock: { name: 'Clock', Mono: Clock, tile: '#2f3338' },
  calculator: { name: 'Calculator', Mono: Calculator, tile: '#34343a' },
  weather: { name: 'Weather', Mono: CloudSun, tile: '#2e3a44' },
  files: { name: 'Files', Mono: Folder, tile: '#35373c' },
  recorder: { name: 'Recorder', Mono: Mic, tile: '#3d2f31' },
  settings: { name: 'Settings', Mono: Settings, tile: '#333337' },
  playstore: { name: 'Play Store', Mono: Store, tile: '#ffffff', Color: PlayMark },
  essential: { name: 'Essential Space', Mono: NotebookPen, tile: '#332a2b' },
  accounting: { name: 'Accounting', Mono: Wallet, tile: '#3a2628' },
};
