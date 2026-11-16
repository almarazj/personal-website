interface Role {
  org: string;
  start: string;
  end?: string;
  stack: string[];
}

/** Current roles first, longest-running first; then past roles, most recently ended first. */
export const byRecency = <T extends Pick<Role, 'start' | 'end'>>(a: T, b: T) =>
  !a.end && !b.end ? a.start.localeCompare(b.start) : (b.end ?? '9999').localeCompare(a.end ?? '9999');

/** Two letters for a missing logo: the first two capitalized words, or the first two letters of one. */
export function monogram(org: string): string {
  const words = org.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : org.slice(0, 2)).toUpperCase();
}

/** What the current roles are built with, each name once. */
export const currentStack = (roles: Role[]) => [...new Set(roles.filter((r) => !r.end).flatMap((r) => r.stack))];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const yearSpan = (start: string, end?: string) => `${start.slice(0, 4)} - ${end ? end.slice(0, 4) : 'now'}`;

/** Certificates: newest first, then by name, since the YAML loader does not keep file order. */
export const byYearThenName = (a: { year: number; name: string }, b: { year: number; name: string }) =>
  b.year - a.year || a.name.localeCompare(b.name);
