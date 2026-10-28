import type { BrowserState, BrowserTab } from '../../os/types';
import { newTab } from '../../os/dataStore';
import { uid } from '../../os/storage';

export const ENGINE_URL: Record<BrowserState['searchEngine'], string> = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
};

export function normalizeInput(input: string, engine: BrowserState['searchEngine']): string {
  const v = input.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  // Looks like a domain (has a dot, no spaces)
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/[^\s]*)?$/.test(v)) return `https://${v}`;
  return ENGINE_URL[engine] + encodeURIComponent(v);
}

export const SHORTCUTS = [
  { name: 'Nothing', url: 'https://nothing.tech', color: '#D71921', letter: 'N' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org', color: '#6b7280', letter: 'W' },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#ff0000', letter: 'Y' },
  { name: 'Gmail', url: 'https://mail.google.com', color: '#ea4335', letter: 'G' },
  { name: 'Maps', url: 'https://maps.google.com', color: '#34a853', letter: 'M' },
  { name: 'Drive', url: 'https://drive.google.com', color: '#4285f4', letter: 'D' },
  { name: 'GitHub', url: 'https://github.com', color: '#24292f', letter: 'Gh' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', color: '#de5833', letter: 'D' },
];

export function withActiveTab(browser: BrowserState, fn: (tab: BrowserTab) => BrowserTab): BrowserState {
  return {
    ...browser,
    tabs: browser.tabs.map((t) => (t.id === browser.activeTabId ? fn(t) : t)),
  };
}

export function openInTab(browser: BrowserState, rawUrl: string): BrowserState {
  const url = normalizeInput(rawUrl, browser.searchEngine);
  if (!url) return browser;
  const now = Date.now();
  const historyEntry = {
    id: uid(),
    title: rawUrl,
    url,
    visitedAt: now,
  };
  const next = withActiveTab(browser, (t) => ({
    ...t,
    url,
    title: rawUrl,
    loading: true,
    blocked: false,
    history: [...t.history.slice(0, t.historyIndex + 1), url],
    historyIndex: t.historyIndex + 1,
  }));
  const tab = next.tabs.find((t) => t.id === next.activeTabId)!;
  return {
    ...next,
    history: tab.incognito ? browser.history : [historyEntry, ...browser.history].slice(0, 300),
  };
}

export function createTab(browser: BrowserState, incognito = false): BrowserState {
  const tab = newTab(incognito);
  return { ...browser, tabs: [...browser.tabs, tab], activeTabId: tab.id };
}

export function closeTab(browser: BrowserState, id: string): BrowserState {
  const tabs = browser.tabs.filter((t) => t.id !== id);
  if (tabs.length === 0) {
    const fresh = newTab();
    return { ...browser, tabs: [fresh], activeTabId: fresh.id };
  }
  return {
    ...browser,
    tabs,
    activeTabId: browser.activeTabId === id ? tabs[tabs.length - 1].id : browser.activeTabId,
  };
}
