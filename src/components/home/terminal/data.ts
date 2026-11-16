import type { CollectionEntry } from 'astro:content';
import type { DirNode } from './fs';
import type { NeofetchInfo } from './neofetch';
import { initials } from './spinner';

type Profile = CollectionEntry<'profile'>['data'];

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

export function terminalData(p: Profile, commit: string | null): TerminalData {
  const info: NeofetchInfo = {
    user: login(p.name),
    initials: initials(p.name),
    role: p.role,
    location: p.location,
    timeZone: p.timeZone,
    languages: p.languages,
    careerStart: p.careerStart,
    links: p.links,
  };
  const home: DirNode = {
    t: 'd',
    c: {
      '.bashrc': { t: 'f', kind: 'txt', body: "# ~/.bashrc\nexport EDITOR=vim\nalias ll='ls -la'\nalias la='ls -a'\nalias l='ls'\n\nneofetch" },
      'about.md': { t: 'f', kind: 'md', body: `# About\n${[p.name, p.role, p.location].join(' · ')}\n\n${p.description}` },
    },
  };
  return { info, commit, home };
}
