// ─────────────────────────────────────────────────────────────
// Central type definitions for the Nothing Phone (3) simulator
// ─────────────────────────────────────────────────────────────

export type PowerState = 'off' | 'booting' | 'locked' | 'unlocked';
export type GlyphEffect = 'off' | 'pulse' | 'wave' | 'ripple' | 'meter' | 'matrix';

export interface SystemState {
  powerState: PowerState;
  pin: string | null;
  brightness: number;
  darkMode: boolean;
  extraDark: boolean;
  fontScale: 'small' | 'default' | 'large';
  displaySize: number; // 0.85 – 1.15
  screenTimeout: number; // seconds
  wallpaper: string;
  customWallpaper: string | null;
  accent: string;
  iconStyle: 'mono' | 'color';
  iconSize: number; // 1 – 5
  autoRotate: boolean;
  wifi: boolean;
  mobileData: boolean;
  bluetooth: boolean;
  airplane: boolean;
  hotspot: boolean;
  wifiNetwork: string;
  savedNetworks: string[];
  pairedDevices: PairedDevice[];
  mediaVol: number;
  ringVol: number;
  notifVol: number;
  dnd: boolean;
  silent: boolean;
  vibrate: boolean;
  soundEffects: boolean;
  ringtone: string;
  batteryLevel: number;
  batterySaver: boolean;
  charging: boolean;
  flashlight: boolean;
  glyphEnabled: boolean;
  glyphEffect: GlyphEffect;
  glyphIntensity: number;
  glyphTimer: number | null;
  glyphClock: boolean;
  language: string;
  lockNotifications: boolean;
  lockedApps: string[];
  showBackView: boolean;
  dataUsage: { wifi: number; mobile: number };
}

export interface PairedDevice {
  id: string;
  name: string;
  kind: 'headphones' | 'watch' | 'speaker' | 'car';
  paired: boolean;
  connected: boolean;
}

export interface AppNotification {
  id: string;
  appId: string;
  title: string;
  text: string;
  time: number;
  ongoing?: boolean;
  read?: boolean;
}

export interface FloatingWindow {
  id: string;
  appId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface LauncherState {
  pages: string[][];
  dock: string[];
  hidden: string[];
  pinned: string[];
  customOrder: string[];
  drawerSort: 'name' | 'custom';
  widgets: string[];
}

// ── Chrome browser ───────────────────────────────────────────
export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  incognito: boolean;
  loading: boolean;
  blocked?: boolean;
}
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  addedAt: number;
}
export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
}
export interface DownloadItem {
  id: string;
  name: string;
  url: string;
  size: string;
  at: number;
}
export interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  downloads: DownloadItem[];
  searchEngine: 'google' | 'duckduckgo' | 'bing';
}

// ── Accounting ───────────────────────────────────────────────
export type TxnType = 'income' | 'expense' | 'transfer';
export interface Account {
  id: string;
  name: string;
  kind: 'cash' | 'bank' | 'card' | 'savings';
  initialBalance: number;
  color: string;
  createdAt: number;
}
export interface Category {
  id: string;
  name: string;
  kind: TxnType;
  icon: string;
  color: string;
}
export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  createdAt: number;
}
export interface AccountingState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  dateFormat: 'yyyy-mm-dd' | 'dd/mm/yyyy' | 'mm/dd/yyyy';
}

// ── PIM apps ─────────────────────────────────────────────────
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  favorite: boolean;
  color: string;
}
export interface Message {
  id: string;
  fromMe: boolean;
  text: string;
  at: number;
}
export interface Thread {
  id: string;
  contactId: string | null;
  address: string;
  title: string;
  messages: Message[];
}
export interface CalEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  color: string;
  note: string;
}
export interface PhotoItem {
  id: string;
  src: string;
  at: number;
  album: string;
  caption?: string;
}
export interface FSNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: 'folder' | 'file';
  mime?: string;
  size?: number;
  content?: string;
  createdAt: number;
}
export interface Note {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}
export interface Alarm {
  id: string;
  time: string; // HH:MM
  label: string;
  enabled: boolean;
  days: number[]; // 0-6
}
export interface WeatherCity {
  id: string;
  name: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  forecast: { day: string; hi: number; lo: number; condition: string }[];
}
export interface Recording {
  id: string;
  name: string;
  at: number;
  duration: number;
  dataUrl?: string;
}
export interface FilesState {
  nodes: FSNode[];
}
