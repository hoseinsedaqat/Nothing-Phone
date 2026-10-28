import type { FC } from 'react';
import {
  Phone,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  CalendarDays,
  Clock,
  Calculator,
  CloudSun,
  Folder,
  Mic,
  Settings,
  NotebookPen,
  Wallet,
  Store,
  type LucideIcon,
} from 'lucide-react';

export interface AppIconProps {
  size?: number;
  monochrome?: boolean;
}

const S = ({ size = 24, children, vb = 48 }: { size?: number; children: React.ReactNode; vb?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" aria-hidden>
    {children}
  </svg>
);

/** Authentic multicolor Google Chrome mark. */
export const ChromeMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <circle cx="24" cy="24" r="22" fill="#fff" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" />
    <path d="M24 4a20 20 0 0 1 17.3 10H24a10 10 0 0 0-9.6 7.1L7.7 9.6A19.9 19.9 0 0 1 24 4Z" fill="#EA4335" />
    <path d="M7.7 9.6 14.4 21a10 10 0 0 0 3.6 13.7l-6.7 11.6A20 20 0 0 1 4 24c0-5.5 2.2-10.5 5.7-14.1Z" fill="#FBBC05" />
    <path d="M24 14l8.7 5a10 10 0 0 1-3.6 18.3L18 44.3A20 20 0 1 0 24 4Z" fill="#34A853" />
    <path d="M24 14a10 10 0 0 1 8.7 5H24a10 10 0 1 0-8.7 15L24 14Z" fill="#4285F4" />
    <circle cx="24" cy="24" r="7" fill="#fff" />
    <circle cx="24" cy="24" r="6" fill="#1A73E8" />
  </S>
);

/** Google Play Store triangle mark. */
export const PlayMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
    <path d="M13.2 9.2 28.8 24 13.2 38.8a2.7 2.7 0 0 1-1.1-2.2V11.4c0-1 .4-1.7 1.1-2.2Z" fill="#34A853" />
    <path d="M34.4 19.6 28.8 24 13.2 9.2l19 9.6a3.1 3.1 0 0 1 2.2.8Z" fill="#FBBC05" />
    <path d="M34.4 28.4 13.2 38.8 28.8 24l5.6 4.4Z" fill="#EA4335" />
    <path d="M37.4 22.1 34.4 19.6 28.8 24l5.6 4.4 3-1.9c1.8-1.1 1.8-3.3 0-4.4Z" fill="#4285F4" />
  </S>
);

/** Google Phone — blue tile, white handset. */
export const PhoneMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#1A73E8" />
    <path
      d="M15.2 9.8c-1.1 0-2 .9-2 2 0 13.3 10.7 24 24 24 1.1 0 2-.9 2-2v-3.3c0-.9-.6-1.7-1.5-1.9l-3.6-.9c-.8-.2-1.6 0-2.1.6l-1.5 1.5a18.6 18.6 0 0 1-8.3-8.3l1.5-1.5c.6-.5.8-1.3.6-2.1l-.9-3.6c-.2-.9-1-1.5-1.9-1.5h-6.3Z"
      fill="#fff"
    />
  </S>
);

/** Google Messages — white tile, layered bubbles, blue bolt. */
export const MessagesMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
    <circle cx="33.5" cy="14.5" r="6.5" fill="#37C2ED" />
    <circle cx="15.5" cy="33" r="5.5" fill="#F9AB15" opacity="0.95" />
    <rect x="10" y="12" width="26" height="22" rx="11" fill="#0B57D0" />
    <path d="M24.8 16.5 19 25.2h4.6l-1.4 6.3 6-9h-4.7l1.3-6Z" fill="#fff" />
  </S>
);

/** Google Camera — light tile, four-color lens ring. */
export const CameraMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#F1F3F4" />
    <rect x="8" y="17" width="32" height="22" rx="6" fill="#3C4043" />
    <circle cx="35" cy="21.5" r="1.7" fill="#E8EAED" />
    <g>
      <path d="M24 13a11 11 0 0 1 9.5 5.5h-5.1A6.4 6.4 0 0 0 24 17.6V13Z" fill="#4285F4" />
      <path d="M33.5 18.5A11 11 0 0 1 35 28l4.4-2.5a11 11 0 0 0-1.5-9.5l-4.4 2.5Z" fill="#34A853" />
      <path d="M35 28a11 11 0 0 1-8 6.9v-5a6.4 6.4 0 0 0 4.6-4l3.4 2.1Z" fill="#FBBC05" />
      <path d="M27 34.9a11 11 0 0 1-9.5-5.5l4.4-2.5a6.4 6.4 0 0 0 5.1 3v5Z" fill="#EA4335" />
      <path d="M17.5 29.4A11 11 0 0 1 14.5 20l-4.4 2.5a11 11 0 0 0 3 9.4l4.4-2.5Z" fill="#4285F4" />
      <circle cx="24" cy="24" r="4.6" fill="#F1F3F4" />
      <circle cx="24" cy="24" r="2.6" fill="#202124" />
    </g>
  </S>
);

/** Google Photos — four-color pinwheel. */
export const PhotosMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
    {[
      { rot: 0, c: '#4285F4' },
      { rot: 90, c: '#EA4335' },
      { rot: 180, c: '#FBBC05' },
      { rot: 270, c: '#34A853' },
    ].map((p) => (
      <path
        key={p.rot}
        d="M24 7c3.6 0 6.5 2.9 6.5 6.5 0 4.7-6.5 9.6-6.5 9.6s-6.5-4.9-6.5-9.6C17.5 9.9 20.4 7 24 7Z"
        fill={p.c}
        transform={`rotate(${p.rot} 24 24)`}
      />
    ))}
  </S>
);

/** Google Contacts — white tile, blue person. */
export const ContactsMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
    <circle cx="24" cy="18" r="7.5" fill="#1A73E8" />
    <path d="M10 39c0-7.2 6.3-12 14-12s14 4.8 14 12v2H10v-2Z" fill="#1A73E8" />
  </S>
);

/** Google Calendar — white tile, blue header, date 31. */
export const CalendarMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
    <path d="M0 12a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v8H0v-8Z" fill="#1A73E8" />
    <text x="24" y="15.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="sans-serif">
      31
    </text>
    <rect x="11" y="27" width="8" height="8" rx="2.5" fill="#EA4335" />
    <rect x="23" y="27" width="8" height="8" rx="2.5" fill="#FBBC05" />
    <rect x="11" y="37" width="8" height="4" rx="2" fill="#34A853" />
    <rect x="23" y="37" width="14" height="4" rx="2" fill="#4285F4" />
  </S>
);

/** Google Clock — white face, colored hour marks. */
export const ClockMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
    <circle cx="24" cy="25" r="16" fill="#fff" stroke="#E3E5E8" strokeWidth="2" />
    <circle cx="24" cy="11.5" r="2" fill="#EA4335" />
    <circle cx="37.5" cy="25" r="2" fill="#FBBC05" />
    <circle cx="24" cy="38.5" r="2" fill="#34A853" />
    <circle cx="10.5" cy="25" r="2" fill="#4285F4" />
    <rect x="22.7" y="15" width="2.6" height="11" rx="1.3" fill="#202124" transform="rotate(35 24 25)" />
    <rect x="22.7" y="23.6" width="2.6" height="8.5" rx="1.3" fill="#5F6368" transform="rotate(140 24 25)" />
    <circle cx="24" cy="25" r="2.4" fill="#202124" />
  </S>
);

/** Google Calculator — dark tile, dot grid + colored operators. */
export const CalculatorMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#202124" />
    {[13, 21, 29].map((x) =>
      [14, 23, 32].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" fill="#E8EAED" />),
    )}
    {[
      { y: 14, c: '#EA4335', g: '+' },
      { y: 23, c: '#4285F4', g: '−' },
      { y: 32, c: '#FBBC05', g: '×' },
      { y: 40, c: '#34A853', g: '÷' },
    ].map((o) => (
      <g key={o.g}>
        <circle cx="37" cy={o.y} r="4.6" fill={o.c} />
        <text x="37" y={o.y + 3.4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="sans-serif">
          {o.g}
        </text>
      </g>
    ))}
  </S>
);

/** Weather — sky tile, sun and cloud. */
export const WeatherMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#4A9FE8" />
    <circle cx="31" cy="17" r="7" fill="#FFD54F" />
    <path
      d="M18 35a7.5 7.5 0 0 1-.9-14.95 9.5 9.5 0 0 1 18.3 2.6A6.2 6.2 0 0 1 33 35H18Z"
      fill="#fff"
    />
  </S>
);

/** Files by Google — multicolor folder. */
export const FilesMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <path d="M8 16a3 3 0 0 1 3-3h7l3.5 4H37a3 3 0 0 1 3 3v1H8v-5Z" fill="#4285F4" />
    <rect x="8" y="20" width="32" height="16" rx="3" fill="#1A73E8" />
    <path d="M17 24h18a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z" fill="#34A853" />
    <rect x="20" y="27.5" width="14" height="3" rx="1.5" fill="#FBBC05" />
    <circle cx="35" cy="16.5" r="3.2" fill="#EA4335" />
  </S>
);

/** Google Recorder — red disc, white microphone. */
export const RecorderMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#fff" />
    <circle cx="24" cy="25" r="14" fill="#EA4335" />
    <rect x="20.5" y="16" width="7" height="12" rx="3.5" fill="#fff" />
    <path d="M17.5 25a6.5 6.5 0 0 0 13 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="22.8" y="30.5" width="2.4" height="4.5" rx="1.2" fill="#fff" />
    <rect x="19" y="34.4" width="10" height="2.2" rx="1.1" fill="#fff" />
  </S>
);

/** Settings — light tile, slate gear. */
export const SettingsMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#E8EAED" />
    <g fill="#5F6368">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="22.4" y="9" width="3.2" height="6" rx="1.6" transform={`rotate(${i * 45} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="10.5" />
    </g>
    <circle cx="24" cy="24" r="4.2" fill="#E8EAED" />
  </S>
);

/** Nothing Essential Space — dark tile, red dot-matrix. */
export const EssentialMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#141416" />
    {Array.from({ length: 25 }).map((_, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const isN = col === 0 || col === 4 || col === row;
      return (
        <circle
          key={i}
          cx={13 + col * 5.5}
          cy={13 + row * 5.5}
          r="1.7"
          fill={isN ? '#D71921' : '#3A3A3E'}
        />
      );
    })}
  </S>
);

/** Accounting — green finance tile, growth bars. */
export const AccountingMark: FC<AppIconProps> = ({ size = 24 }) => (
  <S size={size}>
    <rect width="48" height="48" rx="12" fill="#0F9D58" />
    <rect x="12" y="27" width="6" height="10" rx="2" fill="#fff" />
    <rect x="21" y="21" width="6" height="16" rx="2" fill="#fff" />
    <rect x="30" y="15" width="6" height="22" rx="2" fill="#fff" />
    <circle cx="34.5" cy="14" r="4.2" fill="#D71921" />
    <path d="M32.7 14l1.3 1.3 2.3-2.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const APP_META: Record<
  string,
  { name: string; Mono: LucideIcon; tile: string; Color: FC<AppIconProps> }
> = {
  phone: { name: 'Phone', Mono: Phone, tile: '#3a3f45', Color: PhoneMark },
  messages: { name: 'Messages', Mono: MessageCircle, tile: '#33404d', Color: MessagesMark },
  chrome: { name: 'Chrome', Mono: ChromeMark as unknown as LucideIcon, tile: '#ffffff', Color: ChromeMark },
  camera: { name: 'Camera', Mono: Camera, tile: '#2b2b2e', Color: CameraMark },
  photos: { name: 'Photos', Mono: ImageIcon, tile: '#3d3438', Color: PhotosMark },
  contacts: { name: 'Contacts', Mono: Phone, tile: '#34383d', Color: ContactsMark },
  calendar: { name: 'Calendar', Mono: CalendarDays, tile: '#3c3032', Color: CalendarMark },
  clock: { name: 'Clock', Mono: Clock, tile: '#2f3338', Color: ClockMark },
  calculator: { name: 'Calculator', Mono: Calculator, tile: '#34343a', Color: CalculatorMark },
  weather: { name: 'Weather', Mono: CloudSun, tile: '#2e3a44', Color: WeatherMark },
  files: { name: 'Files', Mono: Folder, tile: '#35373c', Color: FilesMark },
  recorder: { name: 'Recorder', Mono: Mic, tile: '#3d2f31', Color: RecorderMark },
  settings: { name: 'Settings', Mono: Settings, tile: '#333337', Color: SettingsMark },
  playstore: { name: 'Play Store', Mono: Store, tile: '#ffffff', Color: PlayMark },
  essential: { name: 'Essential Space', Mono: NotebookPen, tile: '#332a2b', Color: EssentialMark },
  accounting: { name: 'Accounting', Mono: Wallet, tile: '#3a2628', Color: AccountingMark },
};
