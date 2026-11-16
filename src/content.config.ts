import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// All site content lives in /content; this file is the contract it must satisfy.

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use YYYY-MM');
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
    careerStart: month.optional(),
    links: z.array(z.object({ label: z.string(), url: z.url() })),
  }),
});

// One file per role; the body is the summary paragraph, then highlights as a list.
const experience = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/experience' }),
  schema: ({ image }) =>
    z
      .object({
        role: z.string(),
        org: z.string(),
        url: z.url().optional(),
        // Square, at least 96px; without one the org's initials stand in.
        logo: image().optional(),
        start: month,
        // Left out while the role is current.
        end: month.optional(),
        place: z.string(),
        mode: z.enum(['Remote', 'Hybrid', 'On-site']).optional(),
        type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
        stack: z.array(z.string()).default([]),
      })
      .refine((x) => !x.end || x.end >= x.start, { message: 'end is before start', path: ['end'] }),
});

// One file per degree; the body is its summary.
const education = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/education' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        school: z.string(),
        url: z.url().optional(),
        logo: image().optional(),
        place: z.string().optional(),
        start: month,
        // Left out while the degree is in progress.
        end: month.optional(),
        thesis: z.string().optional(),
      })
      .refine((x) => !x.end || x.end >= x.start, { message: 'end is before start', path: ['end'] }),
});

const certificates = defineCollection({
  loader: file('content/certificates.yaml'),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number().int(),
    // Where to verify or see the original.
    url: z.url().optional(),
  }),
});

export const collections = { profile, experience, education, certificates };
