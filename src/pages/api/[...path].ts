import type {APIRoute} from 'astro';
import {apiRouter} from '../../../server/routes/api';

export const prerender = false;

// Every /api/* request goes to the same router the Bun server used, untouched.
export const ALL: APIRoute = ({request, url}) => apiRouter(request, url.pathname);
