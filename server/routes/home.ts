import { layout } from "../templates/layout";
import { getPostIndex } from "../lib/posts";

export async function homeRoute(_req: Request): Promise<Response> {
  const index = await getPostIndex();

  const postCards = index.posts.map((post, idx) => {
    const date = new Date(post.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    // Estimate reading time (assuming average 200 words per minute)
    const wordCount = post.excerpt.split(/\s+/).length * 10; // Rough estimate based on excerpt
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const tags = post.tags.map(t =>
      `<a href="/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
    ).join("");

    return `
      <article class="post-card" style="animation-delay: ${idx * 0.1}s">
        <div class="post-card-accent"></div>
        <div class="post-content">
          <div class="post-meta">
            <span class="post-date"><i class="far fa-calendar"></i> ${date}</span>
            <span class="post-reading-time"><i class="far fa-clock"></i> ${readingTime} min read</span>
          </div>
          <h2 class="post-title">
            <a href="/post/${post.slug}">${post.title}</a>
          </h2>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-footer">
            <div class="post-tags">${tags}</div>
            <a href="/post/${post.slug}" class="read-more">Read more <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const tagList = Object.entries(index.tags)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) =>
      `<a href="/tag/${encodeURIComponent(tag)}" class="sidebar-tag">${tag} <span>(${count})</span></a>`
    ).join("");

  const content = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="hero-avatar" fetchpriority="high">
        <h1 class="hero-title">Resolving <span class="highlight">Dependencies</span>,<br>One Idea at a Time.</h1>
        <p class="hero-subtitle">A logbook of building and scaling data systems in the real world. I write about data engineering, distributed systems, analytics infrastructure, and the lessons that only show up in production.</p>
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
            <span class="hero-stat-value">2025</span>
            <span class="hero-stat-label">Started</span>
          </div>
        </div>
      </div>
    </section>
    
    <div class="container">
      <div class="content-grid">
        <!-- Main Content -->
        <div class="content-main">
          <!-- Welcome Section -->
          <section class="welcome-section">
            <h2>Welcome</h2>
            <p class="welcome-description">This is my running notebook from production—wins, failures, tradeoffs, and the thinking behind technical decisions. Less theory, more reality.</p>
          </section>
          
          <!-- Posts Grid -->
          <section class="posts-section">
            <h3 class="section-title">Latest Posts</h3>
            <div class="posts-grid">
              ${postCards}
            </div>
          </section>
        </div>
        
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- About Card -->
          <div class="sidebar-card">
            <h3>About Me</h3>
            <div class="about-content">
              <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="author-image">
              <p>Passionate about solving real-world problems with data, I'm a data engineer with experience building enterprise-level solutions.</p>
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="learn-more">Learn more →</a>
            </div>
          </div>
          
          <!-- Newsletter Card -->
          <div class="sidebar-card">
            <h3>Subscribe</h3>
            <p>Get the latest posts delivered to your inbox.</p>
            <form class="newsletter-form" id="newsletter-form">
              <input type="email" name="email" placeholder="Enter your email" required class="newsletter-input">
              <button type="submit" class="newsletter-btn">Subscribe</button>
            </form>
            <div id="newsletter-message" class="newsletter-message"></div>
          </div>
          
          <!-- Tags Card -->
          <div class="sidebar-card">
            <h3>Tags</h3>
            <div class="tags-grid">
              ${tagList}
            </div>
          </div>
        </aside>
      </div>
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

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
