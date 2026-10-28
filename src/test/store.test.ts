import { describe, it, expect, beforeEach } from 'vitest';
import { useOS } from '../os/store';

const reset = () => {
  useOS.setState({
    activeAppId: null,
    recents: [],
    notifications: [],
    notifEnabled: {},
    floating: [],
  });
};

describe('OS store', () => {
  beforeEach(reset);

  it('opens apps and keeps a deduplicated recents stack (most recent first)', () => {
    useOS.getState().openApp('chrome');
    useOS.getState().openApp('settings');
    useOS.getState().openApp('chrome');
    const { recents, activeAppId } = useOS.getState();
    expect(activeAppId).toBe('chrome');
    expect(recents).toEqual(['chrome', 'settings']);
  });

  it('removes and clears recents', () => {
    useOS.getState().openApp('clock');
    useOS.getState().openApp('files');
    useOS.getState().removeRecent('clock');
    expect(useOS.getState().recents).toEqual(['files']);
    useOS.getState().clearRecents();
    expect(useOS.getState().recents).toEqual([]);
  });

  it('respects per-app notification opt-out', () => {
    useOS.getState().toggleAppNotifications('messages'); // enabled -> disabled
    useOS.getState().pushNotification({ appId: 'messages', title: 'X', text: 'Y' });
    expect(useOS.getState().notifications).toHaveLength(0);
    useOS.getState().toggleAppNotifications('messages');
    useOS.getState().pushNotification({ appId: 'messages', title: 'X', text: 'Y' });
    expect(useOS.getState().notifications).toHaveLength(1);
  });

  it('supports at most two floating windows and focuses them', () => {
    useOS.getState().openFloating('clock');
    useOS.getState().openFloating('files');
    useOS.getState().openFloating('weather');
    expect(useOS.getState().floating).toHaveLength(2);
    useOS.getState().focusFloating(useOS.getState().floating[0].id);
    const [a, b] = useOS.getState().floating;
    expect(a.z).toBeGreaterThan(b.z);
  });

  it('moves launcher icons between slots and removes shortcuts', () => {
    const s = useOS.getState();
    const first = s.launcher.pages[0][0];
    s.moveIcon(0, 0, 0, 2);
    expect(useOS.getState().launcher.pages[0][2]).toBe(first);
    s.removeFromHome(first);
    expect(useOS.getState().launcher.pages.flat()).not.toContain(first);
  });

  it('app lock intercepts protected apps until PIN unlock is forced', () => {
    useOS.setState((s) => ({ system: { ...s.system, pin: '1234', lockedApps: ['accounting'] } }));
    useOS.getState().openApp('accounting');
    expect(useOS.getState().activeAppId).toBeNull();
    expect(useOS.getState().pendingApp).toBe('accounting');
    // Forced open after successful PIN entry
    useOS.getState().openApp('accounting', true);
    expect(useOS.getState().activeAppId).toBe('accounting');
    expect(useOS.getState().pendingApp).toBeNull();
    // Unprotected apps open normally
    useOS.getState().openApp('clock');
    expect(useOS.getState().pendingApp).toBeNull();
    useOS.setState((s) => ({ system: { ...s.system, pin: null, lockedApps: [] } }));
  });

  it('airplane mode forces radios off', () => {
    useOS.getState().patchSystem({ wifi: true, bluetooth: true, airplane: false });
    useOS.getState().patchSystem({ airplane: true, wifi: false, bluetooth: false });
    const sys = useOS.getState().system;
    expect(sys.airplane).toBe(true);
    expect(sys.wifi).toBe(false);
    expect(sys.bluetooth).toBe(false);
  });
});
