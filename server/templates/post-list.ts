import type { PostIndex, PostCategory } from "../lib/posts";
import { CATEGORY_META } from "../lib/posts";
import type { PostEngagement } from "../routes/api";
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

export function renderCategoryBadge(category: PostCategory, customBadge?: string): string {
  const meta = CATEGORY_META[category];
  if (category === "open-source") {
    return `<span class="cat-pill cat-pill-oss">${icon("code", { size: 13 })} ${esc(customBadge || meta.shortLabel)}</span>`;
  }
  if (category === "hackathon") {
    const isWinner = customBadge && /winner|1st/i.test(customBadge);
    return `<span class="cat-pill cat-pill-hackathon${isWinner ? " is-winner" : ""}">${icon(isWinner ? "trophy" : "zap", { size: 13 })} ${esc(customBadge || meta.shortLabel)}</span>`;
  }
  return `<span class="cat-pill cat-pill-engineering">${icon("layers", { size: 13 })} ${esc(customBadge || meta.shortLabel)}</span>`;
}

export function renderEngagementStats(slug: string, stats?: Record<string, PostEngagement>): string {
  const s = stats?.[slug] || { likes: 0, comments: 0 };
  return `
    <span class="card-engagement" data-engagement-slug="${esc(slug)}">
      <span class="eng-stat" title="Likes">${icon("thumbs-up", { size: 13 })} <span class="eng-likes">${s.likes}</span></span>
      <span class="eng-stat" title="Comments">${icon("message-square", { size: 13 })} <span class="eng-comments">${s.comments}</span></span>
    </span>
  `;
}

/**
 * Rich Open Source Spotlight Showcase (for BabbleFlow and future OSS releases)
 */
export function renderOpenSourceSpotlight(posts: PostSummary[], stats?: Record<string, PostEngagement>): string {
  if (!posts.length) return "";
  return posts.map(post => {
    const highlights = (post.highlights || []).map(h => `<span class="feature-chip">${icon("check", { size: 12 })} ${esc(h)}</span>`).join("");
    return `
      <article class="oss-spotlight-card reveal-on-scroll" data-category="open-source">
        <div class="oss-spotlight-content">
          <div class="oss-spotlight-top">
            ${renderCategoryBadge("open-source", post.badge || "Open Source")}
            ${post.license ? `<span class="oss-meta-chip">${icon("shield", { size: 12 })} ${esc(post.license)}</span>` : ""}
            <time datetime="${post.date}" class="oss-date">${fmtFull(post.date)}</time>
          </div>

          <h3 class="oss-spotlight-title">
            <a href="/post/${esc(post.slug)}">${esc(post.title)}</a>
          </h3>

          <p class="oss-spotlight-excerpt">${esc(post.excerpt)}</p>

          ${highlights ? `<div class="oss-highlights">${highlights}</div>` : ""}

          <!-- Live Animated Dictation Self-Correction Ticker -->
          <div class="oss-live-demo" aria-label="Animated voice dictation self-correction preview">
            <div class="oss-demo-header">
              <span class="oss-rec-dot"></span>
              <span class="oss-demo-label">Self-Correction Engine Preview (EN + தமிழ்)</span>
            </div>
            <div class="oss-demo-body">
              <div class="oss-demo-spoken">
                <span class="oss-demo-tag">Spoken</span>
                <code>"Schedule a meeting in <del>20 minutes? No, no.</del> 10 minutes."</code>
              </div>
              <div class="oss-demo-arrow">${icon("arrow-right", { size: 14 })}</div>
              <div class="oss-demo-polished">
                <span class="oss-demo-tag tag-ok">Polished</span>
                <code>"Hey, can we schedule a meeting in 10 minutes?"</code>
              </div>
            </div>
          </div>

          <div class="oss-spotlight-footer">
            <div class="oss-cta-group">
              <a href="/post/${esc(post.slug)}" class="btn-cta btn-cta-oss">
                Read Launch Post ${icon("arrow-right", { size: 15 })}
              </a>
              ${post.releaseUrl ? `
                <a href="${esc(post.releaseUrl)}" target="_blank" rel="noopener" class="btn-cta btn-cta-secondary">
                  ${icon("download", { size: 15 })} Download APK
                </a>
              ` : ""}
              ${post.repoUrl ? `
                <a href="${esc(post.repoUrl)}" target="_blank" rel="noopener" class="btn-cta btn-cta-ghost">
                  ${icon("github", { size: 15 })} GitHub
                </a>
              ` : ""}
            </div>
            <div class="oss-meta-right">
              <span>${readingTime(post)} min read</span>
              ${renderEngagementStats(post.slug, stats)}
            </div>
          </div>
        </div>

        <a href="/post/${esc(post.slug)}" class="oss-spotlight-visual" aria-label="Read ${esc(post.title)}">
          <div class="oss-visual-frame">
            ${post.cover ? `<img src="${esc(post.cover)}" alt="${esc(post.title)}" loading="eager" class="oss-main-img">` : ""}
            <div class="oss-floating-pill">
              <img src="/assets/images/babbleflow/pill.png" alt="BabbleFlow floating microphone states" loading="lazy">
            </div>
          </div>
        </a>
      </article>
    `;
  }).join("");
}

/**
 * Rich Hackathon Showcase Grid
 */
export function renderHackathonCards(posts: PostSummary[], stats?: Record<string, PostEngagement>): string {
  if (!posts.length) return "";
  const cards = posts.map((post, i) => {
    const isWinner = post.badge && /winner|1st/i.test(post.badge);
    const eventShort = post.event ? post.event.split(" · ")[0] : "Hackathon Build";
    const highlights = (post.highlights || []).map(h => `<span class="feature-chip">${esc(h)}</span>`).join("");

    return `
      <article class="hackathon-card${isWinner ? " is-winner-card" : ""} reveal-on-scroll" data-category="hackathon">
        <a href="/post/${esc(post.slug)}" class="hackathon-card-link">
          <div class="hackathon-media">
            ${post.cover ? `<img src="${esc(post.cover)}" alt="${esc(post.title)}" loading="${i < 2 ? "eager" : "lazy"}">` : ""}
            <div class="hackathon-media-overlays">
              ${renderCategoryBadge("hackathon", post.badge || "Hackathon")}
              ${post.video ? `<span class="video-pill">${icon("play", { size: 12, filled: true })} Watch Demo</span>` : ""}
            </div>
          </div>

          <div class="hackathon-card-body">
            <div class="hackathon-event-row">
              <span class="hackathon-event-name">${esc(eventShort)}</span>
              <time datetime="${post.date}">${fmtFull(post.date)}</time>
            </div>

            <h3 class="hackathon-card-title">${esc(post.title)}</h3>
            <p class="hackathon-card-excerpt">${esc(post.excerpt)}</p>

            ${highlights ? `<div class="hackathon-chips">${highlights}</div>` : ""}

            <div class="hackathon-card-footer">
              <span class="read-story-cta">Read build story &amp; interactive demo ${icon("arrow-right", { size: 15 })}</span>
              <div class="hackathon-meta-right">
                <span>${readingTime(post)} min</span>
                ${renderEngagementStats(post.slug, stats)}
              </div>
            </div>
          </div>
        </a>
      </article>
    `;
  }).join("");

  return `<div class="hackathon-grid">${cards}</div>`;
}

/**
 * Rich Engineering Deep-Dive Cards / Rows
 */
export function renderEngineeringCards(posts: PostSummary[], stats?: Record<string, PostEngagement>): string {
  if (!posts.length) return "";
  const cards = posts.map((post) => {
    const highlights = (post.highlights || []).slice(0, 3).map(h => `<span class="feature-chip">${esc(h)}</span>`).join("");
    const topTags = post.tags.slice(0, 4).map(t => `<span class="eng-tag">#${esc(t)}</span>`).join("");

    return `
      <article class="eng-card reveal-on-scroll" data-category="engineering">
        <a href="/post/${esc(post.slug)}" class="eng-card-link">
          <div class="eng-card-main">
            <div class="eng-card-top">
              ${renderCategoryBadge("engineering", post.badge || "Architecture")}
              <time datetime="${post.date}" class="eng-card-date">${fmtFull(post.date)}</time>
              <span class="eng-read-time">${icon("clock", { size: 13 })} ${readingTime(post)} min read</span>
            </div>

            <h3 class="eng-card-title">
              <span>${esc(post.title)}</span>
              ${icon("arrow-right", { cls: "icon eng-title-arrow", size: 18 })}
            </h3>

            <p class="eng-card-excerpt">${esc(post.excerpt)}</p>

            <div class="eng-card-bottom">
              <div class="eng-chips-row">
                ${highlights || topTags}
              </div>
              ${renderEngagementStats(post.slug, stats)}
            </div>
          </div>

          ${post.cover ? `
            <div class="eng-card-Diagram" aria-hidden="true">
              <img src="${esc(post.cover)}?v=2026103004" alt="" loading="lazy">
            </div>
          ` : ""}
        </a>
      </article>
    `;
  }).join("");

  return `<div class="eng-cards-list">${cards}</div>`;
}

/**
 * Hairline-separated list of posts (used on Tag pages or compact archives).
 */
export function postRows(posts: PostSummary[], opts: { groupByYear: boolean; stats?: Record<string, PostEngagement> }): string {
  let lastYear: number | null = null;
  const rows = posts.map(post => {
    const year = yearOf(post.date);
    const label = opts.groupByYear && year !== lastYear ? String(year) : "";
    lastYear = year;
    const date = opts.groupByYear ? fmtShort(post.date) : fmtFull(post.date);
    return `
      <li class="post-row reveal-on-scroll" data-category="${esc(post.category)}">
        <span class="post-row-year">${label}</span>
        <div class="post-row-main">
          <div class="post-row-badges">
            ${renderCategoryBadge(post.category, post.badge)}
          </div>
          <h3 class="post-row-title"><a href="/post/${post.slug}" class="post-row-link">${esc(post.title)}</a>${icon("arrow-right", { cls: "icon post-row-arrow" })}</h3>
          <p class="post-row-excerpt">${esc(post.excerpt)}</p>
        </div>
        <div class="post-row-meta">
          <time datetime="${post.date}">${date}</time>
          <span>${readingTime(post)} min read</span>
          ${renderEngagementStats(post.slug, opts.stats)}
        </div>
      </li>`;
  }).join("");
  return `<ul class="post-list">${rows}</ul>`;
}
