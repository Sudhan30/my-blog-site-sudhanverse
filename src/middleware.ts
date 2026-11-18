import {defineMiddleware} from 'astro:middleware';
import {addSecurityHeaders, csrfProtection} from '../server/middleware/security';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Health checks answer before anything else, as they always have.
  if (path === '/health' || path === '/healthz') return next();

  // Origin allowlist for state-changing requests.
  const blocked = csrfProtection(context.request);
  if (blocked) return blocked;

  const response = await next();

  // The API sets its own headers (security, CORS, no-store).
  if (path.startsWith('/api/')) return response;

  const secured = addSecurityHeaders(response);
  const type = secured.headers.get('Content-Type') || '';
  if (type.startsWith('text/html')) {
    if (!type.includes('charset')) secured.headers.set('Content-Type', 'text/html; charset=utf-8');
    if (!secured.headers.has('Cache-Control')) {
      secured.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
  return secured;
});
