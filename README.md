# Nothing Phone (3) — Interactive Web Simulator

A fully interactive, web-based simulation of the **Nothing Phone (3)** running **Nothing OS 5.0**.
It is not a picture of a phone — it boots, locks, launches apps, keeps state across reloads, and
ships with real, usable applications (including a browser simulator and a full accounting app).

Built with **React + TypeScript + Vite + Zustand + Framer Motion**, styled after Nothing's
black/white/red dot-matrix design language.

---

## Live demo

Deployed automatically to GitHub Pages on every push to the default branch:

**https://hoseinsedaqat.github.io/Nothing-Phone/**

The deployment pipeline lives in `.github/workflows/deploy.yml` (build → Pages
artifact → `deploy-pages`), with the Vite base path derived automatically from
`actions/configure-pages`, so all assets work under the `/Nothing-Phone/` subpath.

## Quick start

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm test           # run the Vitest + Testing Library suite
```

The dev server binds to `0.0.0.0` and allows the sandbox preview host (`server.allowedHosts`).

## Project structure

```
src/
├── os/                    # Operating-system layer (framework-agnostic logic)
│   ├── store.ts           # Central Zustand store: system, launcher, notifications, recents
│   ├── dataStore.ts       # Per-app persisted data (browser, accounting, PIM, media…)
│   ├── storage.ts         # Versioned, segmented, crash-resilient LocalStorage layer
│   ├── registry.tsx       # Modular app registry — add an app here, no core changes needed
│   ├── icons.tsx          # App icon set incl. authentic Chrome / Play marks
│   ├── types.ts           # Shared domain types
│   ├── hooks.ts           # useNow, useScreenStack (back navigation), haptics, media queries
│   └── back.ts            # Back-gesture context
├── components/
│   ├── PhoneStage.tsx     # Responsive phone frame, gestures, power/volume keys, stage controls
│   ├── lock/              # Lock screen, PIN pad, lock notifications
│   ├── launcher/          # Home screen, widgets, App Drawer
│   ├── shade/             # Notification shade + Quick Settings
│   ├── glyph/             # Rear Glyph Matrix simulation (Back View)
│   ├── system/            # AppWindow, Recents, Floating windows, Global Search, Toast, Boot…
│   └── ui.tsx             # Shared Nothing-style primitives (Switch, Slider, Sheet, Dialog…)
├── apps/                  # 16 self-contained applications
│   ├── settings/          # Full Settings with every required section
│   ├── chrome/            # Browser simulator (tabs, history, bookmarks, iframe + fallback)
│   ├── accounting/        # Real double-entry-style CRUD finances, reports, CSV
│   └── …                  # Phone, Messages, Camera, Photos, Clock, Calendar, Files, Recorder…
├── styles/                # Design tokens, wallpapers, global CSS
└── test/                  # Vitest unit / integration / component tests
public/
├── manifest.webmanifest   # PWA manifest (installable)
└── sw.js                  # Offline-first service worker
```

## Feature overview

### Device & OS shell
- Realistic Phone (3) frame: centered punch-hole, rounded display, side power/volume keys,
  responsive scaling for desktop and full-screen adaptation for small touch screens.
- Boot animation, power-off/restart/lock power menu, screen-timeout auto-lock.
- **Lock screen**: large Nothing-style clock, date, battery, notifications, flashlight/camera
  shortcuts, swipe-up unlock, optional 4–6 digit demo PIN (set in Settings → Security).
- **Launcher**: multiple home pages, widget row (clock, weather, battery, calendar), drag & drop
  icon reordering in edit mode, long-press menus, removable shortcuts, icon size, page dots,
  dock, wallpaper & accent personalisation, jiggle edit mode.
- **App Drawer**: live search, A–Z/custom sorting, pinned apps, hidden apps section, per-app
  actions, empty-result handling.
- **Quick Settings & notifications**: Wi-Fi, Bluetooth, Airplane, Flashlight, DND, Battery
  Saver, Auto-rotate, Hotspot, Mobile data; brightness & volume sliders; simulated media player;
  actionable notifications; long-press a tile to jump to its Settings page.
- **Recents**: live app previews, dismiss single/all, tap to resume.
- **Multitasking**: up to two draggable, resizable floating windows.
- **Global search**: apps, settings entries, contacts, transactions and notes.
- **Glyph Matrix (Back View)**: pulse/wave/ripple/meter/matrix effects, intensity, Glyph clock,
  Glyph Timer with completion notification, test-notification pattern.
- Gestures: pull-down shade, swipe-up home/drawer, edge back, plus on-screen buttons and
  `Escape`/mouse support; `prefers-reduced-motion` respected.

### Applications (all functional — no dead buttons)
| App | What works |
| --- | --- |
| **Settings** | Every required section: network, Bluetooth pairing, display, personalisation, app info & data clearing, notifications, sound/ringtones (WebAudio preview), battery chart, measured storage usage, PIN & Private Space, Glyph, language, backup export/import, full reset, About Phone specs |
| **Chrome** | Multi-tab browsing, incognito, address/search smart parsing, real iframes with an explicit framing-block fallback + "open externally", bookmarks, history, downloads, 3 search engines, persistence |
| **Accounting** | Accounts (CRUD) with correct balances, income/expense/transfers, categories, filters, sorting, search, monthly/yearly reports, category breakdown, CSV/JSON export, sample data, currency & date formats, wipe with confirmation |
| **Phone** | Dialer, simulated call screen with timer, call history |
| **Messages** | Threads, send, simulated replies, notifications, delete |
| **Contacts** | CRUD, favorites, search, color avatars |
| **Camera** | Real webcam via `getUserMedia` when permitted, demo viewfinder otherwise; saves JPEGs to Photos |
| **Photos** | Albums, viewer, set-as-wallpaper, download, delete |
| **Calendar** | Month grid, event CRUD with colors/times |
| **Clock** | Alarms (fire notifications), world clocks, stopwatch, countdown timer |
| **Calculator** | Full arithmetic with error handling |
| **Weather** | Simulated multi-city forecast, add/remove, refresh |
| **Files** | Virtual file system, folders, text editor, download, recursive delete |
| **Recorder** | `MediaRecorder` capture with demo fallback, playback, delete |
| **Essential Space** | Notes CRUD, pin, colors, search |
| **Play Store** | Simulated catalog with honest install/open states |

### Data & persistence
- Each top-level slice is stored separately under versioned `np3:v1:*` LocalStorage keys.
- Corrupt JSON for one slice never breaks the others; missing fields are merged with defaults.
- Writes are debounced and flushed on tab hide/unload; full export/import and per-slice reset
  are available in Settings.

## Tests

`npm test` runs **31 tests** across:
- storage resilience (corrupt JSON, migrations/merges, export/import, reset),
- accounting math (balances, transfers cannot create money, categories, CSV),
- browser helpers (URL normalization, tab lifecycle, incognito history),
- OS store (recents, notifications opt-out, floating window limits, launcher moves),
- component/integration smoke tests that boot the whole simulator and open every app.

## Honest limitations (simulation boundaries)

This is a web page, not a phone OS, so it **cannot**:
- control real radios, LEDs, physical buttons, screen hardware or telephony — Wi-Fi, Bluetooth,
  flashlight, Glyph, calls and SMS are all **simulated state**;
- run a real Chromium engine — Chrome is a browser **simulator** using iframes, and sites that
  send `X-Frame-Options`/CSP framing restrictions show an explicit fallback instead of a blank page;
- provide real security — the PIN is a demo lock, never a security boundary;
- install third-party apps — Play Store listings are illustrative.

Camera/microphone use genuine browser Web APIs (with permission) and gracefully fall back to
demo modes when denied or unsupported.
