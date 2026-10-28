import { create } from 'zustand';
import type {
  AccountingState,
  Alarm,
  BrowserState,
  BrowserTab,
  CalEvent,
  Contact,
  FilesState,
  FSNode,
  Message,
  Note,
  PhotoItem,
  Recording,
  Thread,
  WeatherCity,
} from './types';
import { loadSlice, queueSave, uid } from './storage';

// ── Browser ──────────────────────────────────────────────────
const newTab = (incognito = false): BrowserTab => ({
  id: uid(),
  title: incognito ? 'Incognito' : 'New tab',
  url: '',
  history: [],
  historyIndex: -1,
  incognito,
  loading: false,
});

const defaultBrowser: BrowserState = {
  tabs: [newTab()],
  activeTabId: '',
  bookmarks: [
    { id: uid(), title: 'Nothing', url: 'https://nothing.tech', addedAt: Date.now() },
    { id: uid(), title: 'Wikipedia', url: 'https://en.wikipedia.org', addedAt: Date.now() },
  ],
  history: [],
  downloads: [],
  searchEngine: 'google',
};
defaultBrowser.activeTabId = defaultBrowser.tabs[0].id;

// ── Accounting ───────────────────────────────────────────────
const defaultAccounting: AccountingState = {
  accounts: [
    { id: 'acc-cash', name: 'Cash', kind: 'cash', initialBalance: 250, color: '#D71921', createdAt: Date.now() },
    { id: 'acc-bank', name: 'Main Bank', kind: 'bank', initialBalance: 4200, color: '#7a7a7a', createdAt: Date.now() },
  ],
  transactions: [],
  categories: [
    { id: 'cat-salary', name: 'Salary', kind: 'income', icon: 'wallet', color: '#4caf50' },
    { id: 'cat-freelance', name: 'Freelance', kind: 'income', icon: 'laptop', color: '#2196f3' },
    { id: 'cat-gift', name: 'Gift', kind: 'income', icon: 'gift', color: '#e91e63' },
    { id: 'cat-food', name: 'Food & Drink', kind: 'expense', icon: 'utensils', color: '#ff9800' },
    { id: 'cat-transport', name: 'Transport', kind: 'expense', icon: 'car', color: '#00bcd4' },
    { id: 'cat-shopping', name: 'Shopping', kind: 'expense', icon: 'shopping-bag', color: '#9c27b0' },
    { id: 'cat-bills', name: 'Bills', kind: 'expense', icon: 'receipt', color: '#f44336' },
    { id: 'cat-fun', name: 'Entertainment', kind: 'expense', icon: 'gamepad', color: '#3f51b5' },
    { id: 'cat-health', name: 'Health', kind: 'expense', icon: 'heart', color: '#e53935' },
  ],
  currency: 'USD',
  dateFormat: 'yyyy-mm-dd',
};

// ── PIM & media defaults ─────────────────────────────────────
const defaultContacts: Contact[] = [
  { id: uid(), name: 'Alex Morgan', phone: '+46 70 123 45 67', email: 'alex@example.com', favorite: true, color: '#D71921' },
  { id: uid(), name: 'Sara Lindqvist', phone: '+46 73 987 65 43', email: 'sara@example.com', favorite: false, color: '#5b6b7a' },
  { id: uid(), name: 'Nothing Support', phone: '+44 20 39000000', email: 'support@nothing.tech', favorite: true, color: '#8a8a8a' },
];

const defaultThreads: Thread[] = [
  {
    id: uid(),
    contactId: null,
    address: '+46 70 123 45 67',
    title: 'Alex Morgan',
    messages: [
      { id: uid(), fromMe: false, text: 'Hey! Did you see the new Phone (3)?', at: Date.now() - 3600_000 * 3 },
      { id: uid(), fromMe: true, text: 'Yes! The Glyph Matrix looks incredible.', at: Date.now() - 3600_000 * 2.8 },
      { id: uid(), fromMe: false, text: 'Want to check it out this weekend?', at: Date.now() - 3600_000 * 2.5 },
    ],
  },
];

const defaultEvents: CalEvent[] = [
  { id: uid(), title: 'Team stand-up', date: new Date().toISOString().slice(0, 10), start: '09:30', end: '10:00', color: '#D71921', note: 'Daily sync' },
];

const defaultFiles: FilesState = {
  nodes: [
    { id: 'root-downloads', parentId: null, name: 'Downloads', kind: 'folder', createdAt: Date.now() },
    { id: 'root-pictures', parentId: null, name: 'Pictures', kind: 'folder', createdAt: Date.now() },
    { id: 'root-docs', parentId: null, name: 'Documents', kind: 'folder', createdAt: Date.now() },
    { id: 'f1', parentId: 'root-docs', name: 'welcome.txt', kind: 'file', mime: 'text/plain', size: 214, content: 'Welcome to Nothing Phone (3) Simulator!\n\nThis is a fully virtual file system.', createdAt: Date.now() },
    { id: 'f2', parentId: 'root-downloads', name: 'nothing-os-5.pdf', kind: 'file', mime: 'application/pdf', size: 184320, createdAt: Date.now() },
  ],
};

const defaultNotes: Note[] = [
  {
    id: uid(),
    title: 'Essential Space',
    body: 'This is your private space for thoughts, checklists and ideas. Everything stays on this device (in your browser storage).',
    color: '#D71921',
    pinned: true,
    updatedAt: Date.now(),
  },
];

const defaultAlarms: Alarm[] = [
  { id: uid(), time: '07:30', label: 'Wake up', enabled: true, days: [1, 2, 3, 4, 5] },
];

const defaultWeather: WeatherCity[] = [
  {
    id: 'stockholm',
    name: 'Stockholm',
    temp: 9,
    condition: 'Cloudy',
    humidity: 78,
    wind: 6,
    forecast: [
      { day: 'Tue', hi: 11, lo: 5, condition: 'Cloudy' },
      { day: 'Wed', hi: 12, lo: 6, condition: 'Rain' },
      { day: 'Thu', hi: 10, lo: 4, condition: 'Wind' },
      { day: 'Fri', hi: 13, lo: 7, condition: 'Sunny' },
      { day: 'Sat', hi: 12, lo: 6, condition: 'Partly Cloudy' },
    ],
  },
];

// ── Data store ───────────────────────────────────────────────
interface DataStore {
  browser: BrowserState;
  accounting: AccountingState;
  contacts: Contact[];
  threads: Thread[];
  events: CalEvent[];
  photos: PhotoItem[];
  files: FilesState;
  notes: Note[];
  alarms: Alarm[];
  weather: WeatherCity[];
  recordings: Recording[];
  installed: Record<string, boolean>;
  patch: <K extends keyof Omit<DataStore, 'patch'>>(key: K, value: DataStore[K]) => void;
  addMessage: (threadId: string, msg: Omit<Message, 'id' | 'at'>) => void;
  resetAppData: (key: keyof Omit<DataStore, 'patch' | 'resetAppData'>) => void;
}

const seededPhotos: PhotoItem[] = [];

export const useData = create<DataStore>((set, get) => ({
  browser: loadSlice('browser', defaultBrowser),
  accounting: loadSlice('accounting', defaultAccounting),
  contacts: loadSlice('contacts', defaultContacts),
  threads: loadSlice('threads', defaultThreads),
  events: loadSlice('events', defaultEvents),
  photos: loadSlice('photos', seededPhotos),
  files: loadSlice('files', defaultFiles),
  notes: loadSlice('notes', defaultNotes),
  alarms: loadSlice('alarms', defaultAlarms),
  weather: loadSlice('weather', defaultWeather),
  recordings: loadSlice('recordings', []),
  installed: loadSlice('installed', {}),

  patch: (key, value) => set({ [key]: value } as Partial<DataStore>),

  addMessage: (threadId, msg) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, { ...msg, id: uid(), at: Date.now() }] }
          : t,
      ),
    })),

  resetAppData: (key) => {
    const defaults: Record<string, unknown> = {
      browser: defaultBrowser,
      accounting: defaultAccounting,
      contacts: defaultContacts,
      threads: defaultThreads,
      events: defaultEvents,
      photos: [],
      files: defaultFiles,
      notes: defaultNotes,
      alarms: defaultAlarms,
      weather: defaultWeather,
      recordings: [],
      installed: {},
    };
    set({ [key]: defaults[key as string] } as Partial<DataStore>);
  },
}));

let lastDataSnap = '';
useData.subscribe((state) => {
  const { patch: _p, resetAppData: _r, ...persistable } = state;
  const snap = JSON.stringify(persistable);
  if (snap === lastDataSnap) return;
  const prev = lastDataSnap ? JSON.parse(lastDataSnap) : {};
  lastDataSnap = snap;
  for (const [k, v] of Object.entries(persistable)) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(v)) queueSave(k, v);
  }
});

export { newTab };
