import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { renderOgImage } from '../lib/og-image';

export const GET: APIRoute = async ({ site }) => {
  const { name, role, location } = (await getEntry('profile', 'profile'))!.data;
  const png = await renderOgImage({ name, role, location, host: site!.host });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
