import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';

// Served at a stable path, unlike content/papers/, so the link can be shared.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await readFile('content/resume.pdf')), { headers: { 'Content-Type': 'application/pdf' } });
