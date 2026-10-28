import { create } from 'zustand';
import type {
  AppNotification,
  FloatingWindow,
  GlyphEffect,
  LauncherState,
  SystemState,
} from './types';
import { loadSlice, queueSave, uid } from './storage';

// ── Defaults ─────────────────────────────────────────────────
const defaultSystem: SystemState = {
  powerState: 'locked',
  pin: null,
  brightness: 72,
  darkMode: true,
  extraDark: false,
  fontScale: 'default',
  displaySize: 1,
  screenTimeout: 30,
  wallpaper: 'dotgrid',
  customWallpaper: null,
  accent: 'red',
  iconStyle: 'mono',
  iconSize: 3,
  autoRotate: true,
  wifi: true,
  mobileData: true,
  bluetooth: false,
  airplane: false,
  hotspot: false,
  wifiNetwork: 'Nothing-5G',
  savedNetworks: ['Nothing-5G', 'Home Wi-Fi', 'Coffee Shop'],
  pairedDevices: [
    { id: 'd1', name: 'Nothing Ear (a)', kind: 'headphones', paired: true, connected: false },
    { id: 'd2', name: 'Nothing Watch', kind: 'watch', paired: true, connected: false },
  ],
  mediaVol: 60,
  ringVol: 70,
  notifVol: 55,
  dnd: false,
  silent: false,
  vibrate: true,
  ringtone: 'Nothing Chime',
  batteryLevel: 84,
  batterySaver: false,
  charging: false,
  flashlight: false,
  glyphEnabled: true,
  glyphEffect: 'pulse',
  glyphIntensity: 70,
  glyphTimer: null,
  glyphClock: false,
  language: 'English',
  lockNotifications: true,
  lockedApps: [],
  showBackView: false,
  dataUsage: { wifi: 14.2, mobile: 3.7 },
};

const defaultLauncher: LauncherState = {
  pages: [
    ['clock', 'weather', 'calendar', 'photos'],
    ['contacts', 'files', 'recorder', 'accounting', 'essential', 'playstore', 'calculator'],
  ],
  dock: ['phone', 'messages', 'chrome', 'camera'],
  hidden: [],
  pinned: ['settings', 'chrome', 'accounting'],
  customOrder: [],
  drawerSort: 'name',
  widgets: ['clock', 'weather'],
};

// Transient UI flags are never persisted.
const TRANSIENT = new Set([
  'shadeMode',
  'drawerOpen',
  'recentsOpen',
  'searchOpen',
  'activeAppId',
  'floating',
  'bootProgress',
  'toast',
  'pendingApp',
]);

interface OSStore {
  system: SystemState;
  launcher: LauncherState;
  notifications: AppNotification[];
  notifEnabled: Record<string, boolean>;
  recents: string[];
  // transient UI
  activeAppId: string | null;
  shadeMode: 'closed' | 'notifications' | 'qs';
  drawerOpen: boolean;
  recentsOpen: boolean;
  searchOpen: boolean;
  floating: FloatingWindow[];
  bootProgress: number;
  toast: string | null;
  pendingApp: string | null;
  // system actions
  patchSystem: (patch: Partial<SystemState>) => void;
  setPower: (s: SystemState['powerState']) => void;
  setBootProgress: (n: number) => void;
  showToast: (msg: string) => void;
  // notifications
  pushNotification: (n: Omit<AppNotification, 'id' | 'time'> & { time?: number }) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  markAllRead: () => void;
  toggleAppNotifications: (appId: string) => void;
  // navigation
  openApp: (appId: string, force?: boolean) => void;
  setPendingApp: (appId: string | null) => void;
  goHome: () => void;
  setShade: (m: OSStore['shadeMode']) => void;
  setDrawer: (open: boolean) => void;
  setRecents: (open: boolean) => void;
  setSearch: (open: boolean) => void;
  // launcher
  patchLauncher: (patch: Partial<LauncherState>) => void;
  moveIcon: (fromPage: number, fromIdx: number, toPage: number, toIdx: number) => void;
  addToHome: (appId: string, page?: number) => void;
  removeFromHome: (appId: string) => void;
  addPage: () => void;
  // recents
  removeRecent: (appId: string) => void;
  clearRecents: () => void;
  // floating windows
  openFloating: (appId: string) => void;
  closeFloating: (id: string) => void;
  updateFloating: (id: string, patch: Partial<FloatingWindow>) => void;
  focusFloating: (id: string) => void;
}

export const useOS = create<OSStore>((set, get) => ({
  system: loadSlice('system', defaultSystem),
  launcher: loadSlice('launcher', defaultLauncher),
  notifications: loadSlice<AppNotification[]>('notifications', []),
  notifEnabled: loadSlice<Record<string, boolean>>('notifEnabled', {}),
  recents: loadSlice<string[]>('recents', []),
  activeAppId: null,
  shadeMode: 'closed',
  drawerOpen: false,
  recentsOpen: false,
  searchOpen: false,
  floating: [],
  bootProgress: 0,
  toast: null,
  pendingApp: null,

  patchSystem: (patch) => set((s) => ({ system: { ...s.system, ...patch } })),
  setPower: (powerState) => set((s) => ({ system: { ...s.system, powerState } })),
  setBootProgress: (bootProgress) => set({ bootProgress }),
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 2600);
  },

  pushNotification: (n) => {
    const enabled = get().notifEnabled[n.appId];
    if (enabled === false) return;
    const full: AppNotification = {
      id: uid(),
      time: n.time ?? Date.now(),
      ...n,
    };
    set((s) => ({ notifications: [full, ...s.notifications].slice(0, 50) }));
  },
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.ongoing) })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  toggleAppNotifications: (appId) =>
    set((s) => ({ notifEnabled: { ...s.notifEnabled, [appId]: !(s.notifEnabled[appId] ?? true) } })),

  openApp: (appId, force = false) => {
    const s = get();
    if (!force && s.system.pin && s.system.lockedApps.includes(appId)) {
      set({ pendingApp: appId, drawerOpen: false, searchOpen: false });
      return;
    }
    set({
      activeAppId: appId,
      pendingApp: null,
      drawerOpen: false,
      recentsOpen: false,
      searchOpen: false,
      shadeMode: 'closed',
      recents: [appId, ...s.recents.filter((r) => r !== appId)].slice(0, 12),
    });
  },
  setPendingApp: (pendingApp) => set({ pendingApp }),
  goHome: () => set({ activeAppId: null, recentsOpen: false, drawerOpen: false, searchOpen: false }),
  setShade: (shadeMode) => set({ shadeMode }),
  setDrawer: (drawerOpen) => set({ drawerOpen }),
  setRecents: (recentsOpen) => set({ recentsOpen }),
  setSearch: (searchOpen) => set({ searchOpen }),

  patchLauncher: (patch) => set((s) => ({ launcher: { ...s.launcher, ...patch } })),

  moveIcon: (fromPage, fromIdx, toPage, toIdx) =>
    set((s) => {
      const pages = s.launcher.pages.map((p) => [...p]);
      if (!pages[fromPage] || !pages[toPage]) return {};
      const [moved] = pages[fromPage].splice(fromIdx, 1);
      if (moved === undefined) return {};
      const target = Math.min(toIdx, pages[toPage].length);
      pages[toPage].splice(target, 0, moved);
      return { launcher: { ...s.launcher, pages } };
    }),

  addToHome: (appId, page = 0) =>
    set((s) => {
      if (s.launcher.pages.some((p) => p.includes(appId)) || s.launcher.dock.includes(appId)) return {};
      const pages = s.launcher.pages.map((p) => [...p]);
      pages[page] = [...pages[page], appId];
      return { launcher: { ...s.launcher, pages } };
    }),

  removeFromHome: (appId) =>
    set((s) => ({
      launcher: {
        ...s.launcher,
        pages: s.launcher.pages.map((p) => p.filter((id) => id !== appId)),
        dock: s.launcher.dock.filter((id) => id !== appId),
      },
    })),

  addPage: () => set((s) => ({ launcher: { ...s.launcher, pages: [...s.launcher.pages, []] } })),

  removeRecent: (appId) =>
    set((s) => ({ recents: s.recents.filter((r) => r !== appId) })),
  clearRecents: () => set({ recents: [] }),

  openFloating: (appId) => {
    const { floating } = get();
    if (floating.length >= 2) {
      get().showToast('Only two floating windows are supported');
      return;
    }
    if (floating.some((f) => f.appId === appId)) {
      get().focusFloating(floating.find((f) => f.appId === appId)!.id);
      return;
    }
    const top = Math.max(0, ...floating.map((f) => f.z)) + 1;
    const offset = floating.length * 28;
    set({
      floating: [
        ...floating,
        { id: uid(), appId, x: 24 + offset, y: 120 + offset, w: 300, h: 480, z: top },
      ],
      activeAppId: null,
    });
  },
  closeFloating: (id) => set((s) => ({ floating: s.floating.filter((f) => f.id !== id) })),
  updateFloating: (id, patch) =>
    set((s) => ({
      floating: s.floating.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),
  focusFloating: (id) =>
    set((s) => {
      const top = Math.max(...s.floating.map((f) => f.z)) + 1;
      return { floating: s.floating.map((f) => (f.id === id ? { ...f, z: top } : f)) };
    }),
}));

// ── Segmented persistence ────────────────────────────────────
let lastSnapshot = '';
useOS.subscribe((state) => {
  const persistable: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (TRANSIENT.has(k)) continue;
    persistable[k] = v;
  }
  const snap = JSON.stringify(persistable);
  if (snap === lastSnapshot) return;
  const prev = lastSnapshot ? JSON.parse(lastSnapshot) : {};
  lastSnapshot = snap;
  for (const [k, v] of Object.entries(persistable)) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(v)) queueSave(k, v);
  }
});

// ── Derived helpers ──────────────────────────────────────────
export const useGlyphEffect = (): GlyphEffect => useOS((s) => s.system.glyphEffect);
