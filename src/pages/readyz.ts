import type {APIRoute} from 'astro';
import {storageReady} from '../../server/routes/api';

export const GET: APIRoute = async () => {
  const ready = await storageReady();
  return Response.json({ready}, {
    status: ready ? 200 : 503,
    headers: {'Cache-Control': 'no-store'},
  });
};
