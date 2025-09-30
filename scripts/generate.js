/* scripts/generate.js
 * Reads Markdown from src/content/posts/*.md with YAML front matter,
 * generates:
 * - src/assets/blog/index.json (list of posts & tags)
 * - src/assets/blog/rss.xml
 * - src/assets/blog/posts/<slug>.html (rendered HTML)
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const POSTS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'posts');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'blog');
const OUT_POSTS = path.join(OUT_DIR, 'posts');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || slugify(path.basename(file, '.md'));
    const title = data.title || slug;
    const date = data.date ? new Date(data.date) : new Date();
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const excerpt = data.excerpt || content.split('\n').slice(0,3).join(' ').slice(0, 180);
    const html = marked.parse(content);
    posts.push({ slug, title, date, tags, excerpt, html });
  }
  // newest first
  posts.sort((a,b)=> b.date - a.date);
  return posts;
}

function writeIndex(posts) {
  const tagsMap = {};
  posts.forEach(p => {
    p.tags.forEach(t => {
      const key = String(t);
      if (!tagsMap[key]) tagsMap[key] = 0;
      tagsMap[key]++;
    });
  });
  const index = posts.map(p => ({
    slug: p.slug, title: p.title, date: p.date.toISOString(),
    tags: p.tags, excerpt: p.excerpt
  }));
  ensureDir(OUT_DIR);
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ posts: index, tags: tagsMap }, null, 2));
}

function writePosts(posts) {
  ensureDir(OUT_POSTS);
  for (const p of posts) {
    const htmlPath = path.join(OUT_POSTS, `${p.slug}.html`);
    const fallbackPath = path.join(OUT_POSTS, `${p.slug}.md.html`);
    
    // Check if custom HTML already exists
    if (fs.existsSync(htmlPath)) {
      console.log(`Custom HTML exists for ${p.slug}.html - preserving it`);
      // Generate a fallback markdown version with different name
      const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><title>${p.title}</title></head><body>${p.html}</body></html>`;
      fs.writeFileSync(fallbackPath, htmlDoc, 'utf8');
      console.log(`Generated fallback: ${p.slug}.md.html`);
    } else {
      // Generate basic HTML from markdown
      const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><title>${p.title}</title></head><body>${p.html}</body></html>`;
      fs.writeFileSync(htmlPath, htmlDoc, 'utf8');
      console.log(`Generated: ${p.slug}.html`);
    }
  }
}

function writeRss(posts) {
  const site = 'https://blog.sudharsana.dev';
  const updated = posts[0] ? posts[0].date.toISOString() : new Date().toISOString();
  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${site}/post/${p.slug}</link>
      <guid>${site}/post/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt}]]></description>
      ${p.tags.map(t => `<category><![CDATA[${t}]]></category>`).join('')}
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Sudharsana Blog</title>
      <link>${site}</link>
      <description>Posts from Sudharsana</description>
      <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
      ${items}
    </channel>
  </rss>`;

  fs.writeFileSync(path.join(OUT_DIR, 'rss.xml'), rss.trim(), 'utf8');
}

function main() {
  const posts = loadPosts();
  ensureDir(OUT_DIR);
  writeIndex(posts);
  writePosts(posts);
  writeRss(posts);
  console.log(`Generated ${posts.length} posts.`);
}
main();
