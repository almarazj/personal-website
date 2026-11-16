import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// All site content lives in /content; this file is the contract it must satisfy.
const profile = defineCollection({
  loader: glob({ pattern: 'profile.md', base: './content' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    description: z.string(),
    links: z.array(z.object({ label: z.string(), url: z.url() })),
  }),
});

export const collections = { profile };
