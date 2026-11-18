// Browser-side identity helpers. The localStorage keys are unchanged from the
// previous site so returning readers keep their likes, alias and comments.

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: carry on without persistence */
  }
};

export const storage = {read, write};

export function getClientId(): string {
  let id = read('blog-client-id');
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
    write('blog-client-id', id);
  }
  return id;
}

export function previousNames(): string[] {
  try {
    return JSON.parse(read('blog-previous-names') || '[]');
  } catch {
    return [];
  }
}

export function rememberName(name: string) {
  const names = previousNames();
  if (!names.includes(name)) {
    names.push(name);
    write('blog-previous-names', JSON.stringify(names));
  }
}

const ADJECTIVES = ['Swift', 'Clever', 'Brave', 'Silent', 'Noble', 'Wild', 'Cosmic', 'Ancient', 'Mystic', 'Golden', 'Silver', 'Crystal', 'Thunder', 'Shadow', 'Lunar', 'Solar', 'Arctic', 'Tropical', 'Desert', 'Ocean', 'Forest', 'Mountain', 'Storm', 'Blazing', 'Frozen', 'Radiant', 'Nimble', 'Fierce', 'Gentle', 'Majestic'];
const ANIMALS = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lynx', 'Deer', 'Seal', 'Puma', 'Crow', 'Orca', 'Ibis', 'Wren', 'Dove', 'Hare', 'Newt', 'Frog', 'Moth', 'Pike', 'Swan', 'Koala', 'Panda', 'Otter', 'Eagle', 'Raven', 'Bison', 'Cobra', 'Finch', 'Crane', 'Viper', 'Tiger', 'Lion', 'Leopard', 'Cheetah', 'Jaguar', 'Panther', 'Falcon', 'Sparrow', 'Robin', 'Dolphin', 'Whale', 'Shark', 'Penguin', 'Albatross', 'Pelican', 'Heron', 'Stork', 'Phoenix', 'Dragon', 'Griffin', 'Pegasus'];

/** The reader's alias: saved one, else one from the server's local model, else a random one. */
export async function resolveDisplayName(): Promise<string> {
  const saved = read('blog-display-name');
  if (saved) return saved;

  let name = '';
  try {
    const res = await fetch('/api/generate-name', {signal: AbortSignal.timeout(8000)});
    if (res.ok) name = (await res.json()).name || '';
  } catch {
    /* fall through to the local generator */
  }
  if (!name) {
    const pick = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
    name = `${ADJECTIVES[pick(ADJECTIVES.length)]}-${ANIMALS[pick(ANIMALS.length)]}-${String(pick(100000)).padStart(5, '0')}`;
  }
  write('blog-display-name', name);
  rememberName(name);
  return name;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return seconds <= 5 ? 'just now' : `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? '1 week ago' : `${w} weeks ago`;
  }
  return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
}
