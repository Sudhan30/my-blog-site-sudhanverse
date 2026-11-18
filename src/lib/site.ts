import type {PostIndex, PostCategory} from '../../server/lib/posts';

export const SITE_NAME = "Sudharsana's Tech Blog";
export const SITE_URL = 'https://blog.sudharsana.dev';
export const AUTHOR = 'Sudharsana Rajasekaran';
export const TAGLINE = 'Resolving Dependencies, One Idea at a Time.';

export type PostSummary = PostIndex['posts'][number];
export type Stats = Record<string, {likes: number; comments: number}>;

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString('en-US', {timeZone: 'UTC', ...opts});

export const fmtShort = (d: string) => fmt(d, {month: 'short', day: 'numeric'});
export const fmtFull = (d: string) => fmt(d, {month: 'short', day: 'numeric', year: 'numeric'});

export const readingTime = (post: PostSummary): number =>
  post.readTime || Math.max(1, Math.ceil((post.excerpt.split(/\s+/).length * 10) / 200));

export const isWinner = (badge?: string) => !!badge && /winner|1st/i.test(badge);

export const CATEGORY_ICON: Record<PostCategory, 'code' | 'trophy' | 'layers'> = {
  'open-source': 'code',
  hackathon: 'trophy',
  engineering: 'layers',
};
