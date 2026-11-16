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
    location: z.string(),
    // IANA zone for the hero's local clock, like America/Argentina/Buenos_Aires.
    timeZone: z.string().refine((tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'not an IANA time zone'),
    languages: z.string().optional(),
    // YYYY-MM of the first software role; the hero counts years from it.
    careerStart: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    links: z.array(z.object({ label: z.string(), url: z.url() })),
  }),
});

export const collections = { profile };
