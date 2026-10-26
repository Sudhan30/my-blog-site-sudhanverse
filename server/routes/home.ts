import { layout } from "../templates/layout";
import { getPostIndex, type PostIndex } from "../lib/posts";
import { tagHue } from "../lib/tags";
import { secureHtml } from "../middleware/security";

type PostSummary = PostIndex["posts"][number];

export async function homeRoute(_req: Request): Promise<Response> {
  const index = await getPostIndex();

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Use readTime from frontmatter, or estimate based on excerpt
  const readingTime = (post: PostSummary) =>
    post.readTime || Math.max(1, Math.ceil((post.excerpt.split(/\s+/).length * 10) / 200));

  const tagLinks = (post: PostSummary) => post.tags.map(t =>
    `<a href="/tag/${encodeURIComponent(t)}" class="tag" style="--tag-hue:${tagHue(t)}">${t}</a>`
  ).join("");

  const featured = index.posts.filter(p => p.featured);
  const spotlight = featured[0];
  const secondary = featured.slice(1, 3);
  const shown = new Set([spotlight, ...secondary].filter(Boolean).map(p => p!.slug));
  const rest = index.posts.filter(p => !shown.has(p.slug));

  const spotlightHtml = spotlight ? `
    <section class="spotlight reveal" aria-label="Featured post">
      <a href="/post/${spotlight.slug}" class="spotlight-media" aria-hidden="true" tabindex="-1">
        ${spotlight.cover ? `<img src="${spotlight.cover}" alt="" loading="eager">` : `<div class="media-fallback" style="--tag-hue:${tagHue(spotlight.tags[0] || spotlight.slug)}"></div>`}
        ${spotlight.video ? `<span class="play-chip"><i class="fas fa-play"></i> Watch the demo</span>` : ""}
      </a>
      <div class="spotlight-body">
        <div class="eyebrow">
          ${spotlight.badge ? `<span class="badge">${spotlight.badge}</span>` : ""}
          <span>${spotlight.event || "Featured"}</span>
        </div>
        <h2 class="spotlight-title"><a href="/post/${spotlight.slug}">${spotlight.title}</a></h2>
        <p class="spotlight-excerpt">${spotlight.excerpt}</p>
        <div class="post-meta">
          <span class="post-date">${fmtDate(spotlight.date)}</span>
          <span class="post-reading-time">${readingTime(spotlight)} min read</span>
        </div>
        <a href="/post/${spotlight.slug}" class="btn btn-primary">Read the story <i class="fas fa-arrow-right"></i></a>
      </div>
    </section>
  ` : "";

  const secondaryHtml = secondary.length ? `
    <div class="feature-pair">
      ${secondary.map(post => `
        <article class="feature-card reveal">
          <a href="/post/${post.slug}" class="feature-media" aria-hidden="true" tabindex="-1">
            ${post.cover ? `<img src="${post.cover}" alt="" loading="lazy">` : `<div class="media-fallback" style="--tag-hue:${tagHue(post.tags[0] || post.slug)}"></div>`}
            ${post.video ? `<span class="play-chip"><i class="fas fa-play"></i> Video</span>` : ""}
          </a>
          <div class="feature-body">
            <div class="eyebrow">
              ${post.badge ? `<span class="badge">${post.badge}</span>` : ""}
              <span>${post.event || fmtDate(post.date)}</span>
            </div>
            <h3 class="post-title"><a href="/post/${post.slug}">${post.title}</a></h3>
            <p class="post-excerpt">${post.excerpt}</p>
          </div>
        </article>
      `).join("")}
    </div>
  ` : "";

  const postCards = rest.map((post, idx) => `
      <article class="post-card reveal" style="--tag-hue:${tagHue(post.tags[0] || post.slug)}; transition-delay:${Math.min(idx, 5) * 60}ms">
        <div class="post-card-accent"></div>
        <div class="post-content">
          <div class="post-meta">
            <span class="post-date">${fmtDate(post.date)}</span>
            <span class="post-reading-time">${readingTime(post)} min read</span>
          </div>
          <h3 class="post-title">
            <a href="/post/${post.slug}">${post.title}</a>
          </h3>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-footer">
            <div class="post-tags">${tagLinks(post)}</div>
            <a href="/post/${post.slug}" class="read-more" aria-label="Read ${post.title}"><i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </article>
    `).join("");

  const tagList = Object.entries(index.tags)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) =>
      `<a href="/tag/${encodeURIComponent(tag)}" class="sidebar-tag" style="--tag-hue:${tagHue(tag)}">${tag} <span>${count}</span></a>`
    ).join("");

  const hackathonCount = index.tags["hackathon"] || 0;

  const content = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="blob blob-a"></div>
        <div class="blob blob-b"></div>
        <div class="blob blob-c"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="hero-content">
        <div class="hero-kicker">
          <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="hero-avatar" fetchpriority="high">
          <span>Sudharsana Rajasekaran · data engineer, builder</span>
        </div>
        <h1 class="hero-title">Resolving <span class="highlight">dependencies</span>,<br>one idea at a time.</h1>
        <p class="hero-subtitle">A logbook of building data systems and AI agents in the real world: production lessons, homelab infrastructure, and the things I ship in a day at hackathons.</p>
        <div class="hero-actions">
          <a href="#latest" class="btn btn-primary">Start reading <i class="fas fa-arrow-down"></i></a>
          <a href="/tag/hackathon" class="btn btn-ghost">Hackathon builds</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-value">${index.posts.length}</span>
            <span class="hero-stat-label">Posts</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value">${Object.keys(index.tags).length}</span>
            <span class="hero-stat-label">Topics</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value">${hackathonCount}</span>
            <span class="hero-stat-label">Hackathon builds</span>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      ${spotlight ? `<h2 class="section-title reveal"><span class="section-index">01</span> Featured</h2>` : ""}
      ${spotlightHtml}
      ${secondaryHtml}

      <section class="posts-section" id="latest">
        <h2 class="section-title reveal"><span class="section-index">${spotlight ? "02" : "01"}</span> Latest writing</h2>
        <div class="posts-grid">
          ${postCards}
        </div>
      </section>

      <!-- About / Subscribe / Topics band -->
      <section class="band">
        <div class="band-card about-card reveal">
          <div class="about-content">
            <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="author-image">
            <div>
              <h3>About me</h3>
              <p>I'm a data engineer who likes solving real problems with data: enterprise pipelines by day, a self-hosted k3s cluster and AI side projects by night.</p>
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="learn-more">More about me <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </div>

        <div class="band-card subscribe-card reveal">
          <h3>Get new posts by email</h3>
          <p>No spam. Just the next write-up when it ships.</p>
          <form class="newsletter-form" id="newsletter-form">
            <input type="email" name="email" placeholder="you@example.com" required class="newsletter-input" aria-label="Email address">
            <button type="submit" class="newsletter-btn">Subscribe</button>
          </form>
          <div id="newsletter-message" class="newsletter-message"></div>
        </div>

        <div class="band-card topics-card reveal">
          <h3>Topics</h3>
          <div class="tags-grid">
            ${tagList}
          </div>
        </div>
      </section>
    </div>

    <script>
      // Newsletter form
      document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const msg = document.getElementById('newsletter-message');
        
        try {
          const res = await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          msg.textContent = data.message;
          msg.className = 'newsletter-message ' + (res.ok ? 'success' : 'error');
          if (res.ok) form.reset();
        } catch {
          msg.textContent = 'Something went wrong. Please try again.';
          msg.className = 'newsletter-message error';
        }
      });
    </script>
  `;

  const html = layout({
    title: "Home",
    description: "Real-world lessons in data engineering, distributed systems, and analytics infrastructure. Production insights, not theory.",
    url: "/",
    content
  });

  const response = secureHtml(html);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
