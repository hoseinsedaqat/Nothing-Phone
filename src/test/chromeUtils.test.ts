import { describe, it, expect } from 'vitest';
import { normalizeInput, createTab, closeTab, openInTab } from '../apps/chrome/chromeUtils';
import type { BrowserState } from '../os/types';

describe('chrome navigation helpers', () => {
  it('passes through full URLs', () => {
    expect(normalizeInput('https://nothing.tech/phone', 'google')).toBe('https://nothing.tech/phone');
  });

  it('upgrades bare domains to https', () => {
    expect(normalizeInput('nothing.tech', 'google')).toBe('https://nothing.tech');
  });

  it('turns free text into search queries', () => {
    expect(normalizeInput('nothing phone review', 'duckduckgo')).toBe(
      'https://duckduckgo.com/?q=nothing%20phone%20review',
    );
    expect(normalizeInput('weather stockholm', 'google').startsWith('https://www.google.com/search?q=')).toBe(true);
  });

  it('creates and closes tabs while keeping an active tab', () => {
    let browser: BrowserState = {
      tabs: [{ id: 't1', title: 'New tab', url: '', history: [], historyIndex: -1, incognito: false, loading: false }],
      activeTabId: 't1',
      bookmarks: [],
      history: [],
      downloads: [],
      searchEngine: 'google',
    };
    browser = createTab(browser);
    expect(browser.tabs).toHaveLength(2);
    browser = closeTab(browser, browser.activeTabId);
    expect(browser.tabs).toHaveLength(1);
    expect(browser.activeTabId).toBe('t1');
    browser = closeTab(browser, 't1');
    expect(browser.tabs).toHaveLength(1);
  });

  it('records history only for non-incognito tabs', () => {
    const normal: BrowserState = {
      tabs: [{ id: 't1', title: '', url: '', history: [], historyIndex: -1, incognito: false, loading: false }],
      activeTabId: 't1',
      bookmarks: [],
      history: [],
      downloads: [],
      searchEngine: 'google',
    };
    const visited = openInTab(normal, 'nothing.tech');
    expect(visited.history).toHaveLength(1);

    const incognito: BrowserState = {
      ...normal,
      tabs: [{ ...normal.tabs[0], incognito: true }],
    };
    const privateVisit = openInTab(incognito, 'nothing.tech');
    expect(privateVisit.history).toHaveLength(0);
  });
});
