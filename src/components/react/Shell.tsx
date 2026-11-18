import {useSyncExternalStore, type ReactNode} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';

type Mode = 'light' | 'dark' | 'system';

// The page decides light or dark before first paint (see Base.astro) and
// publishes it on window.__blogTheme. Astryx's root Theme writes data-theme on
// <html> itself, so every island must be told the page's choice or it would
// reset the page to the system setting.
const subscribe = (notify: () => void) => {
  window.addEventListener('blog-theme', notify);
  return () => window.removeEventListener('blog-theme', notify);
};
const current = (): Mode => (window as {__blogTheme?: Mode}).__blogTheme || 'system';
const onServer = (): Mode => 'system';

/** Every island renders inside the Astryx theme so components pick up tokens and context. */
export function Shell({children}: {children: ReactNode}) {
  const mode = useSyncExternalStore(subscribe, current, onServer);
  return (
    <Theme theme={neutralTheme} mode={mode}>
      {children}
    </Theme>
  );
}
