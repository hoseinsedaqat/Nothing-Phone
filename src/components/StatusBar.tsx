import { Wifi, Bluetooth, Plane, Battery, BatteryCharging, SignalHigh, Moon, Flashlight } from 'lucide-react';
import { useOS } from '../os/store';
import { useNow, formatTime } from '../os/hooks';
import './StatusBar.css';

export default function StatusBar({ dark = false }: { dark?: boolean }) {
  const now = useNow(10_000);
  const sys = useOS((s) => s.system);
  const notifCount = useOS((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <div className={`status-bar ${dark ? 'on-media' : ''}`}>
      <span className="sb-time">{formatTime(now)}</span>
      <div className="sb-right">
        {notifCount > 0 && <span className="sb-dot" aria-label={`${notifCount} notifications`} />}
        {sys.airplane ? (
          <Plane size={13} strokeWidth={2.2} />
        ) : (
          <SignalHigh size={14} strokeWidth={2.2} />
        )}
        {sys.wifi && !sys.airplane && <Wifi size={14} strokeWidth={2.2} />}
        {sys.bluetooth && <Bluetooth size={13} strokeWidth={2.2} />}
        {sys.dnd && <Moon size={12} strokeWidth={2.2} />}
        {sys.flashlight && <Flashlight size={12} strokeWidth={2.2} />}
        <span className={`sb-battery ${sys.batterySaver ? 'saver' : ''}`}>
          {sys.charging ? <BatteryCharging size={17} /> : <Battery size={17} />}
          <small>{sys.batteryLevel}%</small>
        </span>
      </div>
    </div>
  );
}
