import { getAllPosts } from "../lib/posts";
import { addSecurityHeaders } from "../middleware/security";

const SITE_URL = "https://blog.sudharsana.dev";

export async function rssRoute(): Promise<Response> {
    const posts = await getAllPosts();
    const latestDate = posts[0]?.date || new Date().toISOString();

    const items = posts.map(post => {
        const pubDate = new Date(post.date).toUTCString();
        const categories = post.tags.map(t => `<category><![CDATA[${t}]]></category>`).join("");

        return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/post/${post.slug}</link>
      <guid>${SITE_URL}/post/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      ${categories}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sudharsana's Tech Blog</title>
    <link>${SITE_URL}</link>
    <description>Thoughts on software engineering, system design, and the craft of building things.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return addSecurityHeaders(new Response(xml, {
        headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
    }));
}
