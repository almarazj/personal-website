import type { CollectionEntry } from 'astro:content';
import { byRecency, byYearThenName, currentStack } from '../entries';
import type { DirNode, FileNode } from './fs';
import type { NeofetchInfo } from './neofetch';
import { initials } from './spinner';

type Profile = CollectionEntry<'profile'>['data'];
type Role = Pick<CollectionEntry<'experience'>, 'id' | 'body'> & { data: Omit<CollectionEntry<'experience'>['data'], 'logo'> };

type Degree = Pick<CollectionEntry<'education'>, 'id' | 'body'> & { data: Omit<CollectionEntry<'education'>['data'], 'logo'> };
type Certificate = Pick<CollectionEntry<'certificates'>, 'data'>;

export interface TerminalContent {
  profile: Profile;
  experience: Role[];
  education: Degree[];
  certificates: Certificate[];
}

/** Everything the shell needs, serialized into the page once. */
export interface TerminalData {
  info: NeofetchInfo;
  commit: string | null;
  home: DirNode;
}

/** The login is the first name, lowercase and without accents. */
const login = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[^A-Za-z\s]/g, '')
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase() || 'user';

const md = (body: string, href?: string): FileNode => ({ t: 'f', kind: 'md', body, href });

export function terminalData({ profile: p, experience, education, certificates }: TerminalContent, commit: string | null): TerminalData {
  const roles = [...experience].sort((a, b) => byRecency(a.data, b.data));
  const degrees = [...education].sort((a, b) => byRecency(a.data, b.data));
  const info: NeofetchInfo = {
    user: login(p.name),
    initials: initials(p.name),
    role: p.role,
    location: p.location,
    timeZone: p.timeZone,
    languages: p.languages,
    careerStart: p.careerStart,
    stack: currentStack(roles.map((r) => r.data)),
    // The title only: with the school's full name the line pushes neofetch's info below the art.
    education: degrees[0]?.data.title,
    links: p.links,
  };
  const roleFiles = roles.map(({ id, body, data: x }): [string, FileNode] => [
    `${id}.md`,
    md(`# ${x.role}\n${x.org} · ${x.place} · ${x.start} to ${x.end ?? 'now'}\n\n${(body ?? '').trim()}${x.stack.length ? `\n\n- ${x.stack.join(', ')}` : ''}`, `/#exp-${id}`),
  ]);
  const degreeFiles = degrees.map(({ id, body, data: d }): [string, FileNode] => [
    `${id}.md`,
    md(`# ${d.title}\n${d.school} · ${d.start} to ${d.end ?? 'now'}\n\n${(body ?? '').trim()}${d.thesis ? `\n\nThesis: ${d.thesis}` : ''}`, `/#edu-${id}`),
  ]);
  const certs = [...certificates].sort((a, b) => byYearThenName(a.data, b.data));
  const certFile: FileNode = {
    t: 'f',
    kind: 'txt',
    href: '/#edu-certs',
    body: certs.map(({ data: c }) => [c.name.padEnd(34), c.issuer.padEnd(14), c.year].join('  ')).join('\n'),
  };
  const home: DirNode = {
    t: 'd',
    c: {
      '.bashrc': { t: 'f', kind: 'txt', body: "# ~/.bashrc\nexport EDITOR=vim\nalias ll='ls -la'\nalias la='ls -a'\nalias l='ls'\n\nneofetch" },
      'about.md': md(`# About\n${[p.name, p.role, p.location].join(' · ')}\n\n${p.description}`),
      experience: { t: 'd', c: Object.fromEntries(roleFiles), href: '/#experience' },
      education: { t: 'd', c: Object.fromEntries([...degreeFiles, ...(certs.length ? [['certificates.txt', certFile] as const] : [])]), href: '/#education' },
    },
  };
  return { info, commit, home };
}
