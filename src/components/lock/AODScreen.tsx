import { BatteryFull, Bell } from 'lucide-react';
import { useOS } from '../../os/store';
import { useNow, formatTime, haptic } from '../../os/hooks';
import DotClock from '../DotClock';
import './AODScreen.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Always-On Display: ultra-minimal black screen with a dim dot-matrix
 * clock. Any tap / key wakes the device to the full lock screen.
 */
export default function AODScreen() {
  const now = useNow(10_000);
  const sys = useOS((s) => s.system);
  const setPower = useOS((s) => s.setPower);
  const unread = useOS((s) => s.notifications.filter((n) => !n.read).length);

  const wake = () => {
    haptic(8);
    setPower('locked');
  };

  return (
    <div className="aod-screen" onPointerDown={wake} role="button" aria-label="Tap to wake">
      <div className="aod-content">
        <p className="aod-date">
          {DAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
        </p>
        <DotClock value={formatTime(now)} size={84} activeColor="rgba(245,245,247,0.82)" />
        <div className="aod-meta">
          <span className="aod-battery">
            <BatteryFull size={14} /> {sys.batteryLevel}%
            {sys.charging && <em className="aod-charging">· charging</em>}
          </span>
          {unread > 0 && (
            <span className="aod-notifs">
              <Bell size={12} /> {unread}
            </span>
          )}
        </div>
      </div>
      <p className="aod-hint">TAP TO WAKE</p>
    </div>
  );
}
