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
        <article class="featured-item" data-tags="${esc(post.tags.join(","))}">
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
    <div class="home-experience">
    <section class="hero studio-hero" id="top">
      <div class="container studio-shell">
        <div class="studio-copy" data-reveal>
          <div class="studio-kicker"><span class="spark" aria-hidden="true">✳</span><span>DATA FOUNDATIONS · APPLIED AI · HUMAN CURIOSITY</span></div>
          <h1>Ideas are easy.<br><em>Building them</em> is the interesting part.</h1>
          <p class="studio-description">I’m <strong>Sudharsana Rajasekaran</strong>, a Staff Data Engineer working across data platforms, AI agents, solutions architecture and production systems. These are the notes from everything I build, question and learn along the way.</p>
          <div class="studio-actions">
            <a class="studio-primary" href="#latest">Explore the writing <span aria-hidden="true">↘</span></a>
            <a class="studio-secondary" href="#interactive-lab">Follow a system <span aria-hidden="true">↗</span></a>
            <button class="studio-show-search" type="button" data-search-open aria-label="Search articles">⌘ K · SEARCH</button>
          </div>
          <div class="studio-signal">
            <img src="/assets/images/author-potrait-small.png" alt="Portrait of Sudharsana Rajasekaran" width="39" height="39" fetchpriority="high">
            <span><strong>Engineer. Builder. Always a student.</strong><small>Independent field notes, real systems, honest trade-offs.</small></span>
          </div>
        </div>
        <div class="studio-machine" aria-hidden="true">
          <div class="ring"></div><div class="studio-core"><strong>sr.</strong><small>BUILD · LEARN · SHARE</small></div>
          <div class="machine-note one"><small>01 / FOUNDATION</small>Data platforms</div>
          <div class="machine-note two"><small>02 / INTELLIGENCE</small>AI &amp; agents</div>
          <div class="machine-note three"><small>03 / REALITY</small>Production systems</div>
          <span class="machine-dot d1"></span><span class="machine-dot d2"></span><span class="machine-dot d3"></span>
        </div>
      </div>
    </section>

    <div class="container">
      ${featured.length ? `
      <section class="featured-section studio-section" id="featured" aria-labelledby="featured-heading">
        <div class="section-label">01 / THE LATEST</div><div class="studio-section-top"><h2 class="home-heading" id="featured-heading">Things worth <em>building.</em></h2>
        <p class="studio-note">Field reports from shipped experiments, hackathons and systems that actually run.</p></div>
        <div class="featured-grid">${featuredItems}
        </div>
      </section>` : ""}

      <div class="studio-interlude" data-reveal>
        <div class="section-label">A NOTE TO THE READER</div>
        <blockquote>The best engineering lessons rarely come from the happy path. They come from <em>building, breaking, questioning</em> and finding a better way through.</blockquote>
      </div>
      <section class="studio-lab" id="interactive-lab" aria-labelledby="lab-heading" data-reveal>
        <div class="section-label">02 / AN INTERACTIVE DETOUR</div>
        <h2 id="lab-heading">Follow a system.<br>See the decisions.</h2>
        <p class="lab-intro">Like the interactive sketches on my portfolio, this is a conceptual look at the choices between data, agents and operations. Choose a journey to see how the responsibilities change.</p>
        <div class="lab-panel">
          <div class="lab-tabs" role="tablist" aria-label="Choose a system journey">
            <button type="button" class="lab-tab" role="tab" aria-selected="true" aria-controls="lab-canvas" tabindex="0" data-scenario="data"><span>01</span>Data platform</button>
            <button type="button" class="lab-tab" role="tab" aria-selected="false" aria-controls="lab-canvas" tabindex="-1" data-scenario="agent"><span>02</span>AI agent</button>
            <button type="button" class="lab-tab" role="tab" aria-selected="false" aria-controls="lab-canvas" tabindex="-1" data-scenario="operations"><span>03</span>Production</button>
          </div>
          <div>
            <div class="lab-canvas" id="lab-canvas" role="tabpanel" aria-label="System journey">
              <div class="lab-track" role="group" aria-label="Stages of the selected system">
                <div class="lab-node"><strong>Ingest</strong><small>Raw signals</small></div>
                <div class="lab-node"><strong>Resolve</strong><small>Identity</small></div>
                <div class="lab-node"><strong>Model</strong><small>Golden record</small></div>
                <div class="lab-node"><strong>Serve</strong><small>Decisions</small></div>
              </div>
            </div>
            <div class="lab-narrative">
              <div aria-live="polite" aria-atomic="true">
                <h3 id="lab-title">Make the identity trustworthy.</h3>
                <p id="lab-description">A useful data product begins with the signals: standardize records, resolve who they represent, and only then publish a shared view. The order matters more than the diagram.</p>
              </div>
              <button class="lab-replay" id="lab-replay" type="button">Replay journey ↻</button>
            </div>
          </div>
        </div>
      </section>
      <section class="writing-section" id="latest" aria-labelledby="writing-heading" data-reveal>
        <div class="section-label">03 / NOTES FROM THE WORKBENCH</div><h2 class="section-title" id="writing-heading">The writing archive.</h2>
        <div class="journal-toolbar"><div class="journal-filters" role="group" aria-label="Filter writing by category">
            <button type="button" class="journal-filter" data-filter="all" aria-pressed="true">Everything</button><button type="button" class="journal-filter" data-filter="ai" aria-pressed="false">AI &amp; agents</button><button type="button" class="journal-filter" data-filter="systems" aria-pressed="false">Systems</button><button type="button" class="journal-filter" data-filter="cloud" aria-pressed="false">Cloud</button>
          </div><label class="journal-search"><span aria-hidden="true">⌕</span><input id="journal-filter-input" type="search" placeholder="Find an idea…" aria-label="Search the article archive"></label></div>
        <p id="journal-count" class="journal-count" role="status"></p>
        ${postRows(rest, { groupByYear: true })}
        <p id="journal-empty" class="journal-empty" hidden>No notes in this category yet. Try another filter.</p>
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

    <dialog class="journal-search-dialog" id="journal-search-dialog" aria-label="Search all writing">
      <div class="search-dialog-header"><span aria-hidden="true">⌕</span><input type="search" id="journal-global-search" aria-label="Search articles" placeholder="Search topics, articles and builds…" autocomplete="off"><button type="button" data-search-close aria-label="Close search">×</button></div>
      <div class="search-dialog-results" id="journal-search-results"></div>
      <div class="search-dialog-hint">PRESS ESC TO CLOSE · CMD/CTRL + K TO SEARCH</div>
    </dialog>
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
