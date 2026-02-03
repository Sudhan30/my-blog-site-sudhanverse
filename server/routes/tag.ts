import { layout } from "../templates/layout";
import { getPostsByTag } from "../lib/posts";

export async function tagRoute(tag: string): Promise<Response> {
    const posts = await getPostsByTag(tag);

    const postCards = posts.map(post => {
        const date = new Date(post.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const tags = post.tags.map(t =>
            `<a href="/tag/${encodeURIComponent(t)}" class="tag ${t === tag ? 'active' : ''}">${t}</a>`
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

    const noPostsMessage = posts.length === 0 ? `
    <div class="no-posts">
      <i class="fas fa-tag"></i>
      <h3>No posts found for this tag</h3>
      <p>Try browsing other tags or go back to the main page.</p>
      <a href="/" class="btn">Back to Home</a>
    </div>
  ` : "";

    const content = `
    <div class="container">
      <div class="tag-page">
        <div class="tag-header">
          <a href="/" class="back-link">← Back to blog</a>
          <h1>Posts tagged with "${tag}"</h1>
          <span class="tag-badge">${tag}</span>
        </div>
        
        ${posts.length > 0 ? `
          <div class="posts-grid">
            ${postCards}
          </div>
        ` : noPostsMessage}
      </div>
    </div>
  `;

    const html = layout({
        title: `Tag: ${tag}`,
        description: `Blog posts tagged with ${tag}`,
        url: `/tag/${encodeURIComponent(tag)}`,
        content
    });

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
}
