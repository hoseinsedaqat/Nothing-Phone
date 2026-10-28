import { createContext, useContext } from 'react';

/**
 * Allows an app screen to register a back handler with the AppWindow
 * that hosts it, so global gestures / Escape drive in-app navigation.
 * Returning true means the handler consumed the event.
 */
export const BackContext = createContext<{ register: (h: () => boolean) => void } | null>(null);

export function useBackContext() {
  return useContext(BackContext);
}
