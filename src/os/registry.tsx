import type { FC } from 'react';
import { APP_META, type AppIconProps } from './icons';
import { useOS } from './store';
import type { LucideIcon } from 'lucide-react';

import PhoneApp from '../apps/phone/PhoneApp';
import MessagesApp from '../apps/messages/MessagesApp';
import ChromeApp from '../apps/chrome/ChromeApp';
import CameraApp from '../apps/camera/CameraApp';
import PhotosApp from '../apps/photos/PhotosApp';
import ContactsApp from '../apps/contacts/ContactsApp';
import CalendarApp from '../apps/calendar/CalendarApp';
import ClockApp from '../apps/clock/ClockApp';
import CalculatorApp from '../apps/calculator/CalculatorApp';
import WeatherApp from '../apps/weather/WeatherApp';
import FilesApp from '../apps/files/FilesApp';
import RecorderApp from '../apps/recorder/RecorderApp';
import SettingsApp from '../apps/settings/SettingsApp';
import PlayStoreApp from '../apps/playstore/PlayStoreApp';
import EssentialApp from '../apps/essential/EssentialApp';
import AccountingApp from '../apps/accounting/AccountingApp';

export interface AppDefinition {
  id: string;
  name: string;
  Icon: FC<AppIconProps>;
  tile: string;
  Component: FC;
  removable: boolean;
  limitation?: string;
}
const components: Record<string, FC> = {
  phone: PhoneApp,
  messages: MessagesApp,
  chrome: ChromeApp,
  camera: CameraApp,
  photos: PhotosApp,
  contacts: ContactsApp,
  calendar: CalendarApp,
  clock: ClockApp,
  calculator: CalculatorApp,
  weather: WeatherApp,
  files: FilesApp,
  recorder: RecorderApp,
  settings: SettingsApp,
  playstore: PlayStoreApp,
  essential: EssentialApp,
  accounting: AccountingApp,
};

export const APP_REGISTRY: AppDefinition[] = Object.entries(APP_META).map(([id, meta]) => ({
  id,
  name: meta.name,
  tile: meta.tile,
  Component: components[id],
  removable: !['settings', 'phone', 'messages', 'chrome'].includes(id),
  Icon: ({ size = 24, monochrome }: AppIconProps) => {
    const iconStyle = useOS((s) => s.system.iconStyle);
    if (!monochrome && iconStyle === 'color') {
      return <meta.Color size={size} />;
    }
    const Mono = meta.Mono as LucideIcon;
    return <Mono size={size * 0.62} strokeWidth={1.8} color="#f5f5f7" />;
  },
  limitation: {
    phone: 'Calls are simulated — no real telephony in a web app.',
    messages: 'SMS is simulated locally; no messages leave this browser.',
    camera: 'Uses your webcam when permission is granted, otherwise a demo scene is shown.',
    playstore: 'A simulated store — nothing is really downloaded or installed.',
    recorder: 'Recordings are captured via the browser MediaRecorder API and stored locally.',
  }[id],
}));

export const getApp = (id: string): AppDefinition =>
  APP_REGISTRY.find((a) => a.id === id) ?? APP_REGISTRY[0];

export const ALL_APP_IDS = APP_REGISTRY.map((a) => a.id);
