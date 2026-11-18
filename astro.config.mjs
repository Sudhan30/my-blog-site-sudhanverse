import {defineConfig} from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://blog.sudharsana.dev',
  output: 'server',
  // "middleware" mode: server.mjs owns the HTTP server so it can set cache and
  // security headers on static files as well as pages.
  adapter: node({mode: 'middleware'}),
  integrations: [react()],
  server: {host: true, port: 3000},
  // The origin check lives in src/middleware.ts (same allowlist as before the migration).
  security: {checkOrigin: false},
  devToolbar: {enabled: false},
  redirects: {
    // Renamed post: fixed target, so this cannot become an open redirect.
    '/post/babbleflow-private-voice-dictation': {
      status: 301,
      destination: '/post/babblescribe-private-voice-typing',
    },
  },
});
