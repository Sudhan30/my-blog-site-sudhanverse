import { layout } from "../templates/layout";
import { getPostsByTag } from "../lib/posts";
import { secureHtml } from "../middleware/security";
import { tagHue } from "../lib/tags";

export async function tagRoute(tag: string): Promise<Response> {
    const posts = await getPostsByTag(tag);

    const postCards = posts.map(post => {
        const date = new Date(post.date).toLocaleDateString("en-US", {
    timeZone: "UTC",
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const tags = post.tags.map(t =>
            `<a href="/tag/${encodeURIComponent(t)}" class="tag ${t === tag ? 'active' : ''}" style="--tag-hue:${tagHue(t)}">${t}</a>`
        ).join("");

        return `
      <article class="post-card" style="--tag-hue:${tagHue(post.tags[0] || post.slug)}">
        <div class="post-card-accent"></div>
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
            <a href="/post/${post.slug}" class="read-more" aria-label="Read ${post.title}"><i class="fas fa-arrow-right"></i></a>
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
          <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> All posts</a>
          <span class="eyebrow">Topic · ${posts.length} post${posts.length === 1 ? "" : "s"}</span>
          <h1 style="--tag-hue:${tagHue(tag)}"><span class="tag-hash">#</span>${tag}</h1>
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

    return secureHtml(html);
}
