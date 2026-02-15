import { getAllPosts } from "../lib/posts";
import { addSecurityHeaders } from "../middleware/security";

const SITE_URL = "https://blog.sudharsana.dev";

export async function sitemapRoute(): Promise<Response> {
    const posts = await getAllPosts();
    const today = new Date().toISOString().split("T")[0];

    const urls = [
        // Homepage
        `  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,

        // Posts
        ...posts.map(post => `  <url>
    <loc>${SITE_URL}/post/${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),

        // Tags
        ...Array.from(new Set(posts.flatMap(p => p.tags))).map(tag => `  <url>
    <loc>${SITE_URL}/tag/${encodeURIComponent(tag)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return addSecurityHeaders(new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" }
    }));
}
