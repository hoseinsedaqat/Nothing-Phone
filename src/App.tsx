import { useEffect } from 'react';
import PhoneStage from './components/PhoneStage';
import { useOS } from './os/store';
import { flushSaves } from './os/storage';

export default function App() {
  const darkMode = useOS((s) => s.system.darkMode);
  const accent = useOS((s) => s.system.accent);
  const fontScale = useOS((s) => s.system.fontScale);
  const displaySize = useOS((s) => s.system.displaySize);
  const extraDark = useOS((s) => s.system.extraDark);
  const pushNotification = useOS((s) => s.pushNotification);

  // Theme / typography applied at phone-frame level
  useEffect(() => {
    const frame = document.querySelector('.phone-frame') as HTMLElement | null;
    if (!frame) return;
    frame.dataset.theme = darkMode ? 'dark' : 'light';
    frame.dataset.accent = accent;
    frame.dataset.extraDark = String(useOS.getState().system.extraDark && darkMode);
    frame.style.fontSize =
      fontScale === 'small' ? '14.5px' : fontScale === 'large' ? '17.5px' : '16px';
    frame.style.zoom = String(displaySize);
  }, [darkMode, accent, fontScale, displaySize, extraDark]);

  // First-run seed + ambient simulated notifications
  useEffect(() => {
    const SEED_KEY = 'np3:seeded:v1';
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(SEED_KEY, '1');
      setTimeout(() => {
        pushNotification({
          appId: 'weather',
          title: 'Weather · Stockholm',
          text: '9°C and cloudy — light rain expected this evening.',
        });
        pushNotification({
          appId: 'messages',
          title: 'Alex Morgan',
          text: 'Want to check out the Phone (3) this weekend?',
        });
      }, 1800);
    }
    const ambient = setInterval(() => {
      const tips = [
        { appId: 'essential', title: 'Essential Space', text: 'A new idea is waiting — open Essential Space to capture it.' },
        { appId: 'clock', title: 'Glyph Interface', text: 'Try the Glyph Matrix from the back view of your phone.' },
      ] as const;
      const pick = tips[Math.floor(Math.random() * tips.length)];
      if (useOS.getState().system.powerState === 'unlocked') pushNotification({ ...pick });
    }, 120_000);
    return () => clearInterval(ambient);
  }, [pushNotification]);

  // Flush pending writes when tab hides
  useEffect(() => {
    const onHide = () => flushSaves();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  return <PhoneStage />;
}
