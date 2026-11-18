// One small store per page, shared by the like buttons at the top and bottom of
// a post and by the comment count, so they never disagree.
import {useRef, useSyncExternalStore} from 'react';
import {getClientId, storage} from './client';

export type Engagement = {likes: number; liked: boolean; comments: number};

let state: Engagement = {likes: 0, liked: false, comments: 0};
let slug = '';
let loaded = false;
let pending = false;
const listeners = new Set<() => void>();

const set = (next: Partial<Engagement>) => {
  state = {...state, ...next};
  listeners.forEach(l => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const likesUrl = () => `/api/posts/${encodeURIComponent(slug)}/likes`;

async function load() {
  set({liked: storage.read(`liked-${slug}`) === 'true'});
  try {
    const res = await fetch(`${likesUrl()}?clientId=${encodeURIComponent(getClientId())}`);
    if (!res.ok) return;
    const data = await res.json();
    const next: Partial<Engagement> = {likes: typeof data.count === 'number' ? data.count : 0};
    if (typeof data.liked === 'boolean') {
      next.liked = data.liked;
      storage.write(`liked-${slug}`, String(data.liked));
    }
    set(next);
  } catch {
    /* keep the server-rendered count */
  }
}

export async function toggleLike() {
  if (pending) return;
  pending = true;
  const before = state;
  const liked = !before.liked;
  // Optimistic update, rolled back if the server disagrees.
  set({liked, likes: Math.max(0, before.likes + (liked ? 1 : -1))});
  storage.write(`liked-${slug}`, String(liked));
  try {
    const res = await fetch(likesUrl(), {
      method: before.liked ? 'DELETE' : 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({clientId: getClientId()}),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error('like failed');
    const next: Partial<Engagement> = {};
    if (typeof data.count === 'number') next.likes = data.count;
    if (typeof data.liked === 'boolean') next.liked = data.liked;
    set(next);
    storage.write(`liked-${slug}`, String(state.liked));
  } catch {
    set({liked: before.liked, likes: before.likes});
    storage.write(`liked-${slug}`, String(before.liked));
  } finally {
    pending = false;
  }
}

export const setCommentCount = (comments: number) => set({comments});

/** Subscribe a component to the post's engagement; the first caller seeds and loads it. */
export function useEngagement(postSlug: string, initial: {likes: number; comments: number}): Engagement {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    slug = postSlug;
    state = {likes: initial.likes, comments: initial.comments, liked: false};
    queueMicrotask(load);
  }
  // The server snapshot must be the same object on every call during hydration.
  const server = useRef<Engagement>({likes: initial.likes, comments: initial.comments, liked: false});
  return useSyncExternalStore(subscribe, () => state, () => server.current);
}
