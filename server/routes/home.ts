import { layout } from "../templates/layout";
import { getPostIndex } from "../lib/posts";
import { secureHtml } from "../middleware/security";
import { icon } from "../templates/icons";
import { esc, fmtFull, postRows } from "../templates/post-list";

export async function homeRoute(_req: Request): Promise<Response> {
  const index = await getPostIndex();

  const featured = index.posts.filter(p => p.featured);
  const rest = index.posts.filter(p => !p.featured);

  const featuredItems = featured.map((post, i) => {
    // The Video pill already says "video", and track names belong on the post page
    const badge = post.badge && !/video/i.test(post.badge) ? post.badge : "";
    const event = post.event ? post.event.split(" · ")[0] : "";
    // Separators belong to the item that follows them, so they never detach or truncate
    const sep = '<span class="meta-sep" aria-hidden="true">·</span>';
    const metaParts = [
      badge ? `<span class="meta-badge">${esc(badge)}</span>` : "",
      event ? `<span class="meta-event">${badge ? sep : ""}<span class="meta-event-text">${esc(event)}</span></span>` : "",
      `<span class="meta-date">${badge || event ? sep : ""}<time datetime="${post.date}">${fmtFull(post.date)}</time></span>`
    ].join("");
    return `
        <article class="featured-item">
          <a href="/post/${post.slug}" class="featured-link">
            <div class="featured-media">
              ${post.cover ? `<img src="${post.cover}" alt="" loading="${i < 2 ? "eager" : "lazy"}">` : ""}
              ${post.video ? `<span class="video-pill">${icon("play", { size: 12 })} Video</span>` : ""}
            </div>
            <h3 class="featured-title">${esc(post.title)}</h3>
            <p class="featured-excerpt">${esc(post.excerpt)}</p>
            <p class="featured-meta">${metaParts}</p>
          </a>
        </article>`;
  }).join("");

  const sortedTags = Object.entries(index.tags).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  const tagLink = (tag: string) => `<a href="/tag/${encodeURIComponent(tag)}">${esc(tag)}</a>`;
  const topTags = sortedTags.slice(0, 8).map(tagLink).join("");
  const moreTags = sortedTags.slice(8).map(tagLink).join("");

  const content = `
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Resolving dependencies, one idea at a time.</h1>
        <p class="hero-subtitle">A logbook of building data systems and AI agents in the real world: production lessons, homelab infrastructure, and the things I ship in a day at hackathons.</p>
        <div class="byline">
          <img src="/assets/images/author-potrait-small.png" alt="" class="byline-avatar" width="40" height="40" fetchpriority="high">
          <div class="byline-text">
            <span class="byline-name">Sudharsana Rajasekaran</span>
            <span class="byline-role">Data engineer, builder</span>
          </div>
          <div class="byline-links">
            <a href="https://github.com/sudhan30" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${icon("github")}</a>
            <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${icon("linkedin")}</a>
            <a href="https://sudharsana.dev" target="_blank" rel="noopener" aria-label="Portfolio" title="Portfolio">${icon("globe")}</a>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      ${featured.length ? `
      <section class="featured-section" aria-labelledby="featured-heading">
        <h2 class="section-title" id="featured-heading">Hackathon builds</h2>
        <div class="featured-grid">${featuredItems}
        </div>
      </section>` : ""}

      <section class="writing-section" id="latest" aria-labelledby="writing-heading">
        <h2 class="section-title" id="writing-heading">Writing</h2>
        ${postRows(rest, { groupByYear: true })}
      </section>

      <section class="closing">
        <div class="closing-col">
          <h2 class="section-title">About</h2>
          <div class="about">
            <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="about-avatar" width="56" height="56" loading="lazy">
            <div>
              <p>I'm a data engineer who likes solving real problems with data: enterprise pipelines by day, a self-hosted k3s cluster and AI side projects by night.</p>
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="text-link">More about me ${icon("arrow-right")}</a>
            </div>
          </div>
        </div>

        <div class="closing-col">
          <h2 class="section-title">Get new posts by email</h2>
          <p class="closing-copy">No spam. Just the next write-up when it ships.</p>
          <form class="newsletter-form" id="newsletter-form">
            <input type="email" name="email" placeholder="you@example.com" required class="newsletter-input" aria-label="Email address">
            <button type="submit" class="newsletter-btn">Subscribe</button>
          </form>
          <div id="newsletter-message" class="newsletter-message" role="status"></div>

          <h3 class="topics-title">Topics</h3>
          <nav class="topics" aria-label="Topics">${topTags}</nav>
          ${moreTags ? `<details class="topics-more"><summary>All topics</summary><nav class="topics" aria-label="All topics">${moreTags}</nav></details>` : ""}
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
  headers.set("Cache-Control", "public, max-age=300");

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
