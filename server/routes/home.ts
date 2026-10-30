import { layout } from "../templates/layout";
import { getPostIndex } from "../lib/posts";
import { getAllPostStats } from "./api";
import { secureHtml } from "../middleware/security";
import { icon } from "../templates/icons";
import {
  esc,
  renderOpenSourceSpotlight,
  renderHackathonCards,
  renderEngineeringCards,
} from "../templates/post-list";

export async function homeRoute(_req: Request): Promise<Response> {
  const [index, stats] = await Promise.all([
    getPostIndex(),
    getAllPostStats(),
  ]);

  const openSourcePosts = index.posts.filter(p => p.category === "open-source");
  const hackathonPosts = index.posts.filter(p => p.category === "hackathon");
  const engineeringPosts = index.posts.filter(p => p.category === "engineering");

  const sortedTags = Object.entries(index.tags).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  const tagLink = (tag: string) => `<a href="/tag/${encodeURIComponent(tag)}" class="topic-chip">#${esc(tag)}</a>`;
  const topTags = sortedTags.slice(0, 10).map(tagLink).join("");
  const moreTags = sortedTags.slice(10).map(tagLink).join("");

  const content = `
    <section class="hero">
      <div class="container">
        <div class="hero-eyebrow-row reveal-on-scroll">
          <span class="hero-status-pill">
            <span class="status-pulse"></span>
            Open Source · Hackathon Winner · Self-Hosted K3s
          </span>
        </div>

        <h1 class="hero-title reveal-on-scroll">Resolving dependencies, one idea at a time.</h1>
        <p class="hero-subtitle reveal-on-scroll">
          First-hand engineering logs from building privacy-first open source software, shipping winning AI agents at hackathons, and operating distributed data &amp; LLM systems on my own Kubernetes cluster.
        </p>

        <div class="hero-byline-bar reveal-on-scroll">
          <div class="byline">
            <img src="/assets/images/author-potrait-small.png" alt="Sudharsana Rajasekaran" class="byline-avatar" width="44" height="44" fetchpriority="high">
            <div class="byline-text">
              <span class="byline-name">Sudharsana Rajasekaran</span>
              <span class="byline-role">Data Engineer &amp; AI Systems Builder</span>
            </div>
            <div class="byline-links">
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="byline-cta" title="Interactive Portfolio">
                ${icon("globe", { size: 15 })} <span>Portfolio</span>
              </a>
              <a href="https://github.com/sudhan30" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${icon("github")}</a>
              <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${icon("linkedin")}</a>
            </div>
          </div>
        </div>

        <!-- Interactive 3-Pillar Segregation Filter Bar -->
        <div class="pillar-filter-wrapper reveal-on-scroll" role="region" aria-label="Filter posts by category">
          <div class="pillar-tabs-bar" role="tablist">
            <button type="button" class="pillar-tab active" role="tab" aria-selected="true" data-filter="all">
              <span>All Work</span>
              <span class="pillar-count">${index.posts.length}</span>
            </button>
            <button type="button" class="pillar-tab pill-open-source" role="tab" aria-selected="false" data-filter="open-source">
              ${icon("code", { size: 15 })}
              <span>Open Source</span>
              <span class="pillar-count">${openSourcePosts.length}</span>
            </button>
            <button type="button" class="pillar-tab pill-hackathon" role="tab" aria-selected="false" data-filter="hackathon">
              ${icon("trophy", { size: 15 })}
              <span>Hackathons</span>
              <span class="pillar-count">${hackathonPosts.length}</span>
            </button>
            <button type="button" class="pillar-tab pill-engineering" role="tab" aria-selected="false" data-filter="engineering">
              ${icon("layers", { size: 15 })}
              <span>Regular Blog Posts</span>
              <span class="pillar-count">${engineeringPosts.length}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="container home-sections">
      <!-- 1. OPEN SOURCE -->
      ${openSourcePosts.length ? `
      <section class="pillar-section section-oss" id="open-source" data-pillar-section="open-source" aria-labelledby="oss-heading">
        <div class="section-header-bar reveal-on-scroll">
          <div>
            <span class="section-kicker kicker-open-source">${icon("code", { size: 14 })} PILLAR 01 · OPEN SOURCE RELEASES</span>
            <h2 class="section-title" id="oss-heading">Open Source</h2>
            <p class="section-subtitle">Privacy-first apps and developer tools built in the open and released under permissive licenses.</p>
          </div>
          <a href="/category/open-source" class="section-view-link">Open Source page ${icon("arrow-right", { size: 15 })}</a>
        </div>
        ${renderOpenSourceSpotlight(openSourcePosts, stats)}
      </section>` : ""}

      <!-- 2. HACKATHONS -->
      ${hackathonPosts.length ? `
      <section class="pillar-section section-hackathons" id="hackathons" data-pillar-section="hackathon" aria-labelledby="featured-heading">
        <div class="section-header-bar reveal-on-scroll">
          <div>
            <span class="section-kicker kicker-hackathon">${icon("trophy", { size: 14 })} PILLAR 02 · COMPETITIVE AI BUILDS</span>
            <h2 class="section-title" id="featured-heading">Hackathons</h2>
            <p class="section-subtitle">End-to-end AI agents and verification engines built and demoed under the clock at SF hackathons.</p>
          </div>
          <a href="/category/hackathons" class="section-view-link">All Hackathon builds ${icon("arrow-right", { size: 15 })}</a>
        </div>
        ${renderHackathonCards(hackathonPosts, stats)}
      </section>` : ""}

      <!-- 3. REGULAR BLOG POSTS / ENGINEERING DEEP DIVES -->
      ${engineeringPosts.length ? `
      <section class="pillar-section section-engineering" id="latest" data-pillar-section="engineering" aria-labelledby="writing-heading">
        <div class="section-header-bar reveal-on-scroll">
          <div>
            <span class="section-kicker kicker-engineering">${icon("layers", { size: 14 })} PILLAR 03 · SYSTEMS &amp; ARCHITECTURE</span>
            <h2 class="section-title" id="writing-heading">Regular Blog Posts &amp; Architecture Deep Dives</h2>
            <p class="section-subtitle">Production lessons on local multi-model agents, LLM context memory, self-hosted Kubernetes (K3s + FluxCD), and cloud FinOps.</p>
          </div>
          <a href="/category/engineering" class="section-view-link">All Engineering posts ${icon("arrow-right", { size: 15 })}</a>
        </div>
        ${renderEngineeringCards(engineeringPosts, stats)}
      </section>` : ""}

      <section class="closing reveal-on-scroll">
        <div class="closing-col">
          <h2 class="section-title">About the Author</h2>
          <div class="about">
            <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="about-avatar" width="60" height="60" loading="lazy">
            <div>
              <p>I'm a data engineer who loves building end-to-end systems: enterprise data pipelines by day, and open source Android tools, hackathon-winning AI agents, and a self-hosted two-node K3s cluster by night.</p>
              <div class="about-links-row">
                <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="text-link">Explore my interactive portfolio ${icon("arrow-right")}</a>
                <a href="https://github.com/sudhan30" target="_blank" rel="noopener" class="text-link">GitHub (@sudhan30) ${icon("external-link", { size: 14 })}</a>
              </div>
            </div>
          </div>
        </div>

        <div class="closing-col">
          <h2 class="section-title">Get new posts &amp; releases by email</h2>
          <p class="closing-copy">No spam. Just a note when a new open source release, hackathon build, or deep dive ships.</p>
          <form class="newsletter-form" id="newsletter-form">
            <input type="email" name="email" placeholder="you@example.com" required class="newsletter-input" aria-label="Email address">
            <button type="submit" class="newsletter-btn">Subscribe</button>
          </form>
          <div id="newsletter-message" class="newsletter-message" role="status"></div>

          <h3 class="topics-title">Browse by Topic</h3>
          <nav class="topics" aria-label="Topics">${topTags}</nav>
          ${moreTags ? `<details class="topics-more"><summary>All topics</summary><nav class="topics" aria-label="All topics">${moreTags}</nav></details>` : ""}
        </div>
      </section>
    </div>

    <script>
      // Interactive 3-Pillar Category Filter on Homepage
      (function() {
        const filterButtons = document.querySelectorAll('[data-filter]');
        const pillarSections = document.querySelectorAll('[data-pillar-section]');

        function applyFilter(filterValue) {
          filterButtons.forEach(btn => {
            const isMatch = btn.getAttribute('data-filter') === filterValue;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', String(isMatch));
          });

          pillarSections.forEach(sec => {
            const cat = sec.getAttribute('data-pillar-section');
            const show = filterValue === 'all' || cat === filterValue;
            if (show) {
              sec.hidden = false;
              sec.classList.remove('section-fade-in');
              void sec.offsetWidth;
              sec.classList.add('section-fade-in');
            } else {
              sec.hidden = true;
            }
          });
        }

        filterButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-filter');
            applyFilter(val);
          });
        });

        // Support ?category= query param on homepage
        const params = new URLSearchParams(window.location.search);
        const initialCat = params.get('category');
        if (initialCat && ['open-source', 'hackathon', 'engineering'].includes(initialCat)) {
          applyFilter(initialCat);
        }
      })();

      // Refresh live engagement counts (likes & comments) so cached HTML stays fresh
      (async function() {
        try {
          const res = await fetch('/api/posts/stats');
          if (!res.ok) return;
          const data = await res.json();
          const stats = data.stats || {};
          document.querySelectorAll('[data-engagement-slug]').forEach(el => {
            const slug = el.getAttribute('data-engagement-slug');
            if (slug && stats[slug]) {
              const likeEl = el.querySelector('.eng-likes');
              const commentEl = el.querySelector('.eng-comments');
              if (likeEl) likeEl.textContent = stats[slug].likes;
              if (commentEl) commentEl.textContent = stats[slug].comments;
            }
          });
        } catch {}
      })();

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
          msg.textContent = data.message || data.error || 'Subscribed!';
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
    description: "Sudharsana Rajasekaran's engineering logbook: privacy-first open source releases (BabbleFlow), winning AI hackathon builds, and production data & Kubernetes architecture deep dives.",
    url: "/",
    content
  });

  const response = secureHtml(html);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
