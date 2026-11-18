import type {APIRoute} from 'astro';
import {addSecurityHeaders} from '../../server/middleware/security';

export const prerender = false;

export const GET: APIRoute = () =>
  addSecurityHeaders(
    new Response(JSON.stringify({status: 'ok', timestamp: new Date().toISOString()}), {
      headers: {'Content-Type': 'application/json'},
    }),
  );
