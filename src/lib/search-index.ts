import { getCollection, getEntry } from 'astro:content';
import { byRecency } from '../components/home/entries';
import type { PaletteItem } from '../components/site/palette';
import { paperUrl } from './papers';

const short = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');
const where = (url: string) => (url.startsWith('/') ? url : host(url) + url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, ''));

/** Everything the command palette can find, built from content at build time. */
export async function buildSearchIndex(): Promise<PaletteItem[]> {
  const [profile, about, experience, education, publications, projects] = await Promise.all([
    getEntry('profile', 'profile'),
    getEntry('about', 'about'),
    getCollection('experience'),
    getCollection('education'),
    getCollection('publications'),
    getCollection('projects'),
  ]);
  const section = (label: string, id: string, key: string, hint: string, color: string): PaletteItem => ({
    group: 'Sections', label, hint, target: `/#${id}`, keys: ['g', key], color,
  });
  return [
    section('Work experience', 'experience', 'e', 'Roles and tenure', 'experience'),
    section('Education', 'education', 'd', 'Degree, papers and certificates', 'education'),
    section('Projects', 'projects', 'p', 'Every project, by domain', 'projects'),
    section('About', 'about', 'a', 'Bio, photos and quick questions', 'about'),
    ...experience
      .sort((a, b) => byRecency(a.data, b.data))
      .map(({ id, data: x }) => ({ group: 'Experience', label: x.role, hint: `${x.org} · ${x.place}`, target: `/#exp-${id}` })),
    ...projects
      .sort((a, b) => a.data.order - b.data.order)
      .map(({ id, data: p }) => ({ group: 'Projects', label: p.title, hint: short(p.summary), target: `/projects/${id}` })),
    ...education.map(({ id, data: d }) => ({ group: 'Education', label: d.title, hint: d.school, target: `/#edu-${id}` })),
    ...publications.map(({ data: p }) => ({ group: 'Education', label: p.title, hint: `Paper · ${p.venue} ${p.year}`, target: paperUrl(p.file) })),
    ...(about?.data.questions.length
      ? [{ group: 'About', label: 'Quick questions', hint: about.data.questions.map((q) => `${q.q} ${q.a}`).join(' · '), target: '/#about-questions' }]
      : []),
    ...(profile?.data.links ?? []).map((l) => ({ group: 'Links', label: l.label, hint: where(l.url), target: l.url })),
    { group: 'Actions', label: 'Switch theme', hint: 'Light or dark', target: 'action:theme', keys: ['t'] },
    { group: 'Actions', label: 'Back to top', hint: 'Scroll to the hero', target: 'action:top', keys: ['g', 'g'] },
  ];
}
