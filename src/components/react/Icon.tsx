import {ICON_PATHS, type IconName} from '../../../server/templates/icons';

const FILLABLE = new Set(['thumbs-up', 'heart', 'star', 'play']);

/** Same Lucide paths the server-rendered pages use, as a React element. */
export function Icon({name, size = 16, filled = false}: {name: IconName; size?: number; filled?: boolean}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled && FILLABLE.has(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{__html: ICON_PATHS[name]}}
    />
  );
}
