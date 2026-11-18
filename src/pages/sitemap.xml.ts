import type {APIRoute} from 'astro';
import {sitemapResponse} from '../lib/feeds';

export const prerender = false;
export const GET: APIRoute = () => sitemapResponse();
