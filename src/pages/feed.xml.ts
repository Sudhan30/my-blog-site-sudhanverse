import type {APIRoute} from 'astro';
import {rssResponse} from '../lib/feeds';

export const prerender = false;
export const GET: APIRoute = () => rssResponse();
