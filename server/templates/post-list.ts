import type { PostIndex } from "../lib/posts";
import { icon } from "./icons";
import { esc } from "../lib/escape";

export type PostSummary = PostIndex["posts"][number];

export { esc };

export const readingTime = (post: PostSummary): number =>
  post.readTime || Math.max(1, Math.ceil((post.excerpt.split(/\s+/).length * 10) / 200));

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export const fmtShort = (d: string) => fmt(d, { month: "short", day: "numeric" });
export const fmtFull = (d: string) => fmt(d, { month: "short", day: "numeric", year: "numeric" });
const yearOf = (d: string) => new Date(d).getUTCFullYear();

/**
 * Hairline-separated list of posts. Each row is a single link (stretched over the row).
 * With `groupByYear`, the year shows only on the first row of each year.
 */
export function postRows(posts: PostSummary[], opts: { groupByYear: boolean }): string {
  let lastYear: number | null = null;
  const rows = posts.map(post => {
    const year = yearOf(post.date);
    const label = opts.groupByYear && year !== lastYear ? String(year) : "";
    lastYear = year;
    const date = opts.groupByYear ? fmtShort(post.date) : fmtFull(post.date);
    return `
      <li class="post-row" data-tags="${esc(post.tags.join(","))}">
        <span class="post-row-year">${label}</span>
        <div class="post-row-main">
          <h3 class="post-row-title"><a href="/post/${post.slug}" class="post-row-link">${esc(post.title)}</a>${icon("arrow-right", { cls: "icon post-row-arrow" })}</h3>
          <p class="post-row-excerpt">${esc(post.excerpt)}</p>
        </div>
        <div class="post-row-meta">
          <time datetime="${post.date}">${date}</time>
          <span>${readingTime(post)} min read</span>
        </div>
      </li>`;
  }).join("");
  return `<ul class="post-list">${rows}</ul>`;
}
