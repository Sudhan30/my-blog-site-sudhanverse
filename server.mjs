// Production entry: `node server.mjs` (after `astro build`).
// Static files (dist/client) are served here with byte-range support for video
// and with the same cache and security headers as before the Astro migration.
// Everything else goes to the Astro handler (pages, feeds, /api, /health).
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import send from 'send';
import {handler} from './dist/server/entry.mjs';

const PORT = Number(process.env.PORT || 80);
const HOST = process.env.HOST || '0.0.0.0';
const CLIENT_DIR = fileURLToPath(new URL('./dist/client/', import.meta.url));
const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

function staticHeaders(res, path) {
  res.setHeader(
    'Cache-Control',
    path.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  const isRead = req.method === 'GET' || req.method === 'HEAD';

  if (isRead && HAS_EXTENSION.test(path) && !path.startsWith('/api/')) {
    let decoded = path;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      /* serve the raw path; send rejects anything malformed */
    }
    send(req, decoded, {root: CLIENT_DIR, index: false, dotfiles: 'deny', cacheControl: false})
      .on('headers', () => staticHeaders(res, path))
      // Not a file on disk (for example /rss.xml): let Astro answer.
      .on('error', () => handler(req, res))
      .pipe(res);
    return;
  }

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Blog server running at http://${HOST}:${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
