import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../lib/search-index';

export const GET: APIRoute = async () => Response.json(await buildSearchIndex());
