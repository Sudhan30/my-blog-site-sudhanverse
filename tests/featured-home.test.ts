import {expect, test} from 'bun:test';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const entry = pathToFileURL(resolve('dist/server/entry.mjs')).href;

async function homepage(entries: {slug: string; date: string; featured?: boolean; video?: string}[]) {
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
        try {const html=await (await fetch('http://127.0.0.1:'+server.address().port+'/')).text(); process.stdout.write(html);}
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
