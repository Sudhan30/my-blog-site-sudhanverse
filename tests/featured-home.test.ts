import {expect, test} from 'bun:test';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {renderMarkdown} from '../server/lib/markdown';

const entry = pathToFileURL(resolve('dist/server/entry.mjs')).href;

async function homepage(entries: {slug: string; date: string; featured?: boolean; video?: string; tags?: string[]}[], path = '/') {
  const directory = await mkdtemp(join(tmpdir(), 'blog-feature-test-'));
  let processUnderTest;
  try {
    const posts = join(directory, 'content', 'posts');
    await mkdir(posts, {recursive: true});
    for (const post of entries) {
      const fields = Object.entries(post).map(([k, v]) => k + ': ' + JSON.stringify(v));
      await writeFile(join(posts, post.slug + '.md'), ['---', 'title: ' + post.slug, 'category: engineering', ...fields, '---', 'A build note.'].join('\n'));
    }
    const run = `import {createServer} from 'node:http'; import {handler} from ${JSON.stringify(entry)};
      const server=createServer(handler); server.listen(0,'127.0.0.1',async()=>{
        try {const html=await (await fetch('http://127.0.0.1:'+server.address().port+${JSON.stringify(path)})).text(); process.stdout.write(html);}
        finally {server.closeAllConnections(); server.close();}
      });`;
    processUnderTest = Bun.spawn([process.execPath, '-e', run], {
      cwd: directory, env: {...process.env, DATABASE_URL: '', BLOG_SCHEMA_MANAGED_EXTERNALLY: ''},
      stdout: 'pipe', stderr: 'inherit',
    });
    const html = await new Response(processUnderTest.stdout).text();
    expect(await processUnderTest.exited).toBe(0);
    return html;
  } finally {
    processUnderTest?.kill();
    await rm(directory, {recursive: true, force: true});
  }
}

test('newest marked entry wins, ties use slug, and a text-only feature never borrows a video', async () => {
  const html = await homepage([
    {slug:'current', date:'2026-11-19'},
    {slug:'z-build', date:'2026-11-18', featured:true, video:'/assets/video/older.mp4'},
    {slug:'a-essay', date:'2026-11-18', featured:true},
  ]);
  const feature = html.match(/<section class="feature-story"[\s\S]*?<\/section>/)?.[0];
  expect(feature).toContain('/post/a-essay');
  expect(feature).not.toContain('#recording');
  const archive = html.slice(html.indexOf('archive-rows'));
  expect(archive.indexOf('/post/current')).toBeLessThan(archive.indexOf('/post/a-essay'));
  expect(archive.indexOf('/post/a-essay')).toBeLessThan(archive.indexOf('/post/z-build'));
});
test('an archive without marked entries stays accessible', async () => {
  const html = await homepage([{slug:'archive-only', date:'2026-11-18'}]);
  expect(html).not.toContain('class="feature-story"');
  expect(html).toContain('href="/post/archive-only"');
});

test('archive search matches all terms across title and tags and keeps category links shareable', async () => {
  const html = await homepage([
    {slug:'query-planner', date:'2026-11-10', tags:['Databases']},
    {slug:'systems', date:'2026-11-11', tags:['databases']},
  ], '/?category=engineering&q=DATABASES+planner');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('href="/post/query-planner"');
  expect(html).not.toContain('href="/post/systems"');
  expect(html).toContain('1 article matching');
  expect(html).toContain('href="/?category=engineering#latest">Clear search');
});

test('a search with no matches keeps a way back to the archive', async () => {
  const html = await homepage([{slug:'notes', date:'2026-11-10'}], '/?q=infrastructure');
  expect(html).toContain('No articles matching');
  expect(html).toContain('href="/#latest">Clear search');
});

test('contents labels and unique deep links come from the same rendered headings', async () => {
  const {html, headings} = await renderMarkdown('## A & B\n\n### A & B\n\n## A & B\n\n## **A B-3**');
  expect(headings).toEqual([
    {id: 'a-b', label: 'A & B', level: 2},
    {id: 'a-b-2', label: 'A & B', level: 3},
    {id: 'a-b-3', label: 'A & B', level: 2},
    {id: 'a-b-3-2', label: 'A B-3', level: 2},
  ]);
  for (const h of headings) {
    expect(html).toContain(`<h${h.level} id="${h.id}" class="prose-heading">`);
    expect(html).toContain(`class="heading-anchor" href="#${h.id}"`);
  }
});

test('fenced code blocks render with Shiki dual-theme variables and language header', async () => {
  const {html} = await renderMarkdown('```sql\nSELECT count(*) FROM posts;\n```');
  expect(html).toContain('<figure class="code-block" data-lang="sql">');
  expect(html).toContain('<span class="code-block-lang">SQL</span>');
  expect(html).toContain('--shiki-light:');
  expect(html).toContain('--shiki-dark:');
});

test('engineering callouts transform GitHub alert blockquotes into styled asides', async () => {
  const {html} = await renderMarkdown('> [!IMPORTANT]\n> **Invariant:** Rules decide after vector search.');
  expect(html).toContain('<aside class="callout callout-important" role="note">');
  expect(html).toContain('<p class="callout-title">Key Decision</p>');
  expect(html).toContain('Rules decide after vector search.');
});

test('article pages render system highlights and related engineering posts', async () => {
  const html = await homepage([
    {slug: 'k3s-cluster', date: '2026-11-18', tags: ['kubernetes', 'gitops']},
    {slug: 'flux-rollouts', date: '2026-11-17', tags: ['kubernetes', 'gitops']},
    {slug: 'sql-agent', date: '2026-11-16', tags: ['sql']},
  ], '/post/k3s-cluster');
  expect(html).toContain('Continue reading');
  expect(html).toContain('href="/post/flux-rollouts"');
});

test('missing article and category pages keep their requested canonical and link to the archive', async () => {
  for (const path of ['/post/missing', '/category/missing']) {
    const html = await homepage([], path);
    expect(html).toContain(`rel="canonical" href="https://blog.sudharsana.dev${path}"`);
    expect(html).toContain('Page not found');
    expect(html).toContain('href="/#latest"');
  }
});
