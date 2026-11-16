import { defineCollection, reference } from 'astro:content';
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

const publications = defineCollection({
  loader: file('content/publications.yaml'),
  schema: z.object({
    title: z.string(),
    // Set when the paper is not in English; the site says so next to the title.
    language: z.string().optional(),
    authors: z.array(z.string()).min(1),
    venue: z.string(),
    year: z.number().int(),
    // A PDF in content/papers/.
    file: z.string().regex(/^[\w-]+\.pdf$/, 'a file name in content/papers/'),
    proceedings: z.url().optional(),
    project: reference('projects').optional(),
  }),
});

export const ANSWER_ICONS = ['book', 'book-open', 'film', 'music', 'flag', 'ball'] as const;

// The body is the bio.
const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './content' }),
  schema: ({ image }) => z.object({
    photos: z
      .array(
        z.object({
          image: image(),
          // Describes the place and what is in the photo.
          alt: z.string(),
          // Two to four words, on the polaroid's strip.
          caption: z.string().max(28),
        }),
      )
      .default([]),
    questions: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
          detail: z.string(),
          icon: z.enum(ANSWER_ICONS),
          link: z.url().optional(),
        }),
      )
      .default([]),
  }),
});

export const PROJECT_CONTEXTS = ['Work', 'Client', 'Personal', 'Academic'] as const;
export const PROJECT_DOMAINS = ['Backend', 'ML', 'DSP', 'Acoustics', 'Electronics'] as const;

// One file per project; the body is the project page.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        // One or two sentences: the card shows three lines of it.
        summary: z.string(),
        year: z.number().int(),
        context: z.enum(PROJECT_CONTEXTS),
        domains: z.array(z.enum(PROJECT_DOMAINS)).min(1),
        // Position on the home, lowest first.
        order: z.number(),
        live: z.boolean().default(false),
        // Client work: never a screenshot, names or figures that identify the client; a diagram is fine.
        confidential: z.boolean().default(false),
        stack: z.array(z.string()).default([]),
        links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
        cover: image().optional(),
        // What the image shows, for people who cannot see it.
        coverAlt: z.string().optional(),
        // What it means, shown under it on the project page; never a repeat of the alt text.
        coverCaption: z.string().optional(),
      })
      .refine((p) => !p.cover || p.coverAlt, { message: 'a cover needs coverAlt', path: ['coverAlt'] }),
});

export const collections = { profile, experience, education, certificates, publications, projects, about };
