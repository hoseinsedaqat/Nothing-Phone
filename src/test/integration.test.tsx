import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import App from '../App';
import { useOS } from '../os/store';
import { APP_REGISTRY } from '../os/registry';

describe('full simulator integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useOS.setState({
      activeAppId: null,
      shadeMode: 'closed',
      drawerOpen: false,
      recentsOpen: false,
      searchOpen: false,
      floating: [],
      notifications: [],
    });
    useOS.setState((s) => ({ system: { ...s.system, powerState: 'locked' } }));
  });

  it('boots into the lock screen', () => {
    render(<App />);
    expect(useOS.getState().system.powerState).toBe('locked');
    expect(screen.getByLabelText('Flashlight')).toBeInTheDocument();
    expect(screen.getByLabelText('Camera')).toBeInTheDocument();
    expect(document.querySelector('.dot-clock')).toBeInTheDocument();
  });

  it('unlocks with a single tap on the lock screen', () => {
    render(<App />);
    const lock = document.querySelector('.lock-screen')!;
    act(() => {
      lock.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 400 }));
      lock.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 400 }));
    });
    expect(useOS.getState().system.powerState).toBe('unlocked');
  });

  it('unlocks and renders the home screen with the dock', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    expect(screen.getByText(/search apps, settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
  });

  it('opens every registered app without crashing', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    for (const app of APP_REGISTRY) {
      act(() => useOS.getState().openApp(app.id));
      expect(useOS.getState().activeAppId).toBe(app.id);
      // The app window must render some visible content
      const windows = document.querySelectorAll('.app-window');
      expect(windows.length).toBeGreaterThan(0);
      act(() => useOS.getState().goHome());
      expect(useOS.getState().activeAppId).toBeNull();
    }
  });

  it('toggles quick settings and reflects state in the system store', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    act(() => useOS.getState().setShade('qs'));
    const wifiTile = screen.getAllByText('Wi-Fi')[0].closest('button')!;
    const before = useOS.getState().system.wifi;
    act(() => fire(wifiTile));
    expect(useOS.getState().system.wifi).toBe(!before);
    act(() => useOS.getState().setShade('closed'));
  });

  it('opens the app drawer and filters apps live', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    act(() => useOS.getState().setDrawer(true));
    const input = screen.getByPlaceholderText('Search apps');
    act(() => {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'chr');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(screen.getAllByText('Chrome').length).toBeGreaterThan(0);
  });

  it('renders the Glyph back view and its controls', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    act(() => useOS.getState().patchSystem({ showBackView: true }));
    expect(screen.getByText(/Glyph Matrix · simulated/i)).toBeInTheDocument();
    expect(screen.getByText('Glyph settings')).toBeInTheDocument();
    act(() => useOS.getState().patchSystem({ showBackView: false }));
  });

  it('shows the PIN gate for locked apps', () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    act(() => useOS.getState().patchSystem({ pin: '0000', lockedApps: ['clock'] }));
    act(() => useOS.getState().openApp('clock'));
    expect(useOS.getState().pendingApp).toBe('clock');
    expect(screen.getByText(/Enter PIN to open Clock/i)).toBeInTheDocument();
    act(() => useOS.getState().setPendingApp(null));
    act(() => useOS.getState().patchSystem({ pin: null, lockedApps: [] }));
  });

  it('creates an accounting transaction and updates totals', async () => {
    render(<App />);
    act(() => useOS.getState().setPower('unlocked'));
    act(() => useOS.getState().openApp('accounting'));
    const addBtn = screen.getAllByLabelText('Add transaction')[0];
    act(() => fire(addBtn));
    const amount = document.querySelector('.amount-input') as HTMLInputElement;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(amount, '120');
      amount.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const saveBtn = screen.getByText('Save transaction');
    act(() => fire(saveBtn));
    // Money should now appear somewhere on the dashboard
    const body = document.querySelector('.acc-app')!;
    expect(within(body as HTMLElement).getAllByText(/120/).length).toBeGreaterThan(0);
  });
});

function fire(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
