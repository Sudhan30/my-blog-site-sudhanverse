import { layout } from "../templates/layout";
import { CATEGORY_META, getPostIndex, getPostsByCategory, resolveCategorySlug } from "../lib/posts";
import { getAllPostStats } from "./api";
import { secureHtml } from "../middleware/security";
import { icon } from "../templates/icons";
import {
  esc,
  renderOpenSourceSpotlight,
  renderHackathonCards,
  renderEngineeringCards,
} from "../templates/post-list";

export async function categoryRoute(rawSlug: string): Promise<Response> {
  const category = resolveCategorySlug(rawSlug);
  if (!category) {
    return secureHtml("Category not found", 404);
  }

  const [posts, index, stats] = await Promise.all([
    getPostsByCategory(category),
    getPostIndex(),
    getAllPostStats(),
  ]);

  const meta = CATEGORY_META[category];

  let bodyHtml = "";
  if (category === "open-source") {
    bodyHtml = renderOpenSourceSpotlight(posts, stats);
  } else if (category === "hackathon") {
    bodyHtml = renderHackathonCards(posts, stats);
  } else {
    bodyHtml = renderEngineeringCards(posts, stats);
  }

  const navPills = (["open-source", "hackathon", "engineering"] as const).map((cat) => {
    const m = CATEGORY_META[cat];
    const active = cat === category ? " active" : "";
    const count = index.categories[cat] || 0;
    const iconName = cat === "open-source" ? "code" : cat === "hackathon" ? "trophy" : "layers";
    return `
      <a href="/category/${m.slug}" class="pillar-tab pill-${cat}${active}" ${cat === category ? 'aria-current="page"' : ""}>
        ${icon(iconName, { size: 15 })}
        <span>${esc(m.label)}</span>
        <span class="pillar-count">${count}</span>
      </a>
    `;
  }).join("");

  const content = `
    <div class="container category-page category-${category}">
      <header class="category-hero reveal-on-scroll">
        <a href="/" class="back-link">${icon("arrow-left")} All writing &amp; releases</a>
        <div class="category-kicker-row">
          <span class="category-kicker kicker-${category}">${esc(meta.kicker)}</span>
          <span class="category-total">${posts.length} ${posts.length === 1 ? "entry" : "entries"}</span>
        </div>
        <h1 class="category-title">${esc(meta.title)}</h1>
        <p class="category-description">${esc(meta.description)}</p>

        <nav class="pillar-tabs-bar" aria-label="Browse by category">
          <a href="/" class="pillar-tab">
            <span>All Work</span>
            <span class="pillar-count">${index.posts.length}</span>
          </a>
          ${navPills}
        </nav>
      </header>

      <section class="category-showcase">
        ${bodyHtml}
      </section>
    </div>
  `;

  const html = layout({
    title: meta.title,
    description: meta.description,
    url: `/category/${meta.slug}`,
    content,
  });

  const response = secureHtml(html);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
