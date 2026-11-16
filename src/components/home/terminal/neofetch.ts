import { tenure } from '../tenure';
import { esc, link, span } from './html';

export const HOST = 'ubuntu';

export interface NeofetchInfo {
  user: string;
  /** Letters the spinning art draws. */
  initials: string;
  role: string;
  location: string;
  timeZone: string;
  languages?: string;
  /** YYYY-MM of the first software role. */
  careerStart?: string;
  stack: string[];
  links: { label: string; url: string }[];
}

export const localTime = (now: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(now);

const zoneLabel = (now: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value;

export function uptime(careerStart: string, now: Date): string {
  const years = Math.floor(tenure(careerStart, null, now).years);
  return years < 1 ? 'under a year in software engineering' : `${years}+ years in software engineering`;
}

type Row = { key: string; text: string; html?: string };

/** `withClock` adds the visitor-side local time; the build leaves it out so a static page never shows a stale one. */
export function rows(info: NeofetchInfo, now: Date, withClock = false): Row[] {
  const out: Row[] = [{ key: 'Role', text: info.role }];
  if (info.careerStart) out.push({ key: 'Uptime', text: uptime(info.careerStart, now) });
  if (info.stack.length) out.push({ key: 'Stack', text: info.stack.join(', ') });
  const clock = withClock ? ` · ${localTime(now, info.timeZone)} (${zoneLabel(now, info.timeZone)})` : '';
  out.push({ key: 'Based', text: info.location + clock });
  if (info.languages) out.push({ key: 'Languages', text: info.languages });
  if (info.links.length) {
    const names = info.links.map((l) => l.label.toLowerCase());
    out.push({ key: 'Links', text: names.join(' · '), html: info.links.map((l, i) => link(l.url, names[i])).join(' · ') });
  }
  return out;
}

const SWATCHES = ['dim', 'err', 'ok', 'acc', 'info', 'mag', 'cyan', 'fg'];

export function neofetchHTML(info: NeofetchInfo, now: Date, art: string, withClock = false): string {
  const head = `${span('c-acc b', info.user)}@${span('c-acc b', HOST)}\n${'-'.repeat(info.user.length + HOST.length + 1)}`;
  const body = rows(info, now, withClock).map((r) => `${span('c-acc b', r.key)}: ${r.html ?? esc(r.text)}`).join('\n');
  const swatches = SWATCHES.map((c) => `<span class="sw sw-${c}"></span>`).join('');
  return `<div class="nf"><div class="nf-art" data-spin="${esc(info.initials)}" aria-hidden="true">${esc(art)}</div><div class="nf-info">${head}\n${body}\n\n${swatches}\n\n${span('c-dim', 'type help to look around')}</div></div>`;
}

export const neofetchText = (info: NeofetchInfo, now: Date) =>
  `${info.user}@${HOST}\n${rows(info, now, true).map((r) => `${r.key}: ${r.text}`).join('\n')}`;
