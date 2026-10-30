import { layout } from "../templates/layout";
import { getPostsByTag } from "../lib/posts";
import { getAllPostStats } from "./api";
import { secureHtml } from "../middleware/security";
import { icon } from "../templates/icons";
import { esc, postRows } from "../templates/post-list";

export async function tagRoute(tag: string): Promise<Response> {
    const [posts, stats] = await Promise.all([
        getPostsByTag(tag),
        getAllPostStats(),
    ]);
    const safeTag = esc(tag);

    const noPostsMessage = `
    <div class="no-posts">
      <h2>No posts found for this tag</h2>
      <p>Try browsing other tags or go back to the main page.</p>
      <a href="/" class="text-link">Back to home ${icon("arrow-right")}</a>
    </div>
  `;

    const content = `
    <div class="container">
      <div class="tag-page">
        <header class="tag-header">
          <a href="/" class="back-link">${icon("arrow-left")} All writing</a>
          <h1 class="tag-title">Posts tagged <span class="tag-name">#${safeTag}</span></h1>
          <p class="tag-count">${posts.length} post${posts.length === 1 ? "" : "s"}</p>
        </header>

        ${posts.length > 0 ? postRows(posts, { groupByYear: false, stats }) : noPostsMessage}
      </div>
    </div>
  `;

    const html = layout({
        title: `Tag: ${tag}`,
        description: `Blog posts tagged with ${tag}`,
        url: `/tag/${encodeURIComponent(tag)}`,
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
