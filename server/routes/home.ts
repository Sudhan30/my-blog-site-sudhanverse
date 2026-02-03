import { layout } from "../templates/layout";
import { getPostIndex } from "../lib/posts";

export async function homeRoute(_req: Request): Promise<Response> {
    const index = await getPostIndex();

    const postCards = index.posts.map(post => {
        const date = new Date(post.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const tags = post.tags.map(t =>
            `<a href="/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
        ).join("");

        return `
      <article class="post-card">
        <div class="post-content">
          <div class="post-meta">
            <time datetime="${post.date}">${date}</time>
          </div>
          <h2 class="post-title">
            <a href="/post/${post.slug}">${post.title}</a>
          </h2>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-footer">
            <div class="post-tags">${tags}</div>
            <a href="/post/${post.slug}" class="read-more">Read more →</a>
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
        <h1 class="hero-title">Resolving Dependencies,<br>One Idea at a Time.</h1>
        <p class="hero-subtitle">Thoughts on software engineering, system design, and the craft of building things</p>
      </div>
    </section>
    
    <div class="container">
      <div class="content-grid">
        <!-- Main Content -->
        <div class="content-main">
          <!-- Welcome Section -->
          <section class="welcome-section">
            <h2>Welcome to my Log File</h2>
            <p class="welcome-description">Exploring modern technology and the journey of solving real-world problems. This blog is a collection of notes from the field, documenting the real-world tech challenges I encounter.</p>
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
        description: "Thoughts on software engineering, system design, and the craft of building things. A collection of notes from the field.",
        url: "/",
        content
    });

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
}
