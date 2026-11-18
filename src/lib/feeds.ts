import {getAllPosts, CATEGORY_META} from '../../server/lib/posts';
import {SITE_URL} from './site';

const xmlHeaders = (type: string) => ({'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600'});

export async function rssResponse(): Promise<Response> {
  const posts = await getAllPosts();
  const latestDate = posts[0]?.date || new Date().toISOString();

  const items = posts
    .map(post => {
      const pubDate = new Date(post.date).toUTCString();
      const categories = post.tags.map(t => `<category><![CDATA[${t}]]></category>`).join('');
      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/post/${post.slug}</link>
      <guid>${SITE_URL}/post/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      ${categories}
    </item>`;
    })
    .join('\n');

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

  return new Response(xml, {headers: xmlHeaders('application/rss+xml')});
}

export async function sitemapResponse(): Promise<Response> {
  const posts = await getAllPosts();
  const today = new Date().toISOString().split('T')[0];
  const entry = (loc: string, lastmod: string, changefreq: string, priority: string) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const urls = [
    entry(`${SITE_URL}/`, today, 'weekly', '1.0'),
    ...Object.values(CATEGORY_META).map(cat => entry(`${SITE_URL}/category/${cat.slug}`, today, 'weekly', '0.9')),
    ...posts.map(post => entry(`${SITE_URL}/post/${post.slug}`, new Date(post.date).toISOString().split('T')[0], 'monthly', '0.8')),
    ...Array.from(new Set(posts.flatMap(p => p.tags))).map(tag => entry(`${SITE_URL}/tag/${encodeURIComponent(tag)}`, today, 'weekly', '0.6')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {headers: xmlHeaders('application/xml')});
}
