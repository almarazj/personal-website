import { describe, expect, it } from 'vitest';
import { byRecency, currentStack, monogram, monthLabel } from '../../src/components/home/entries';
import { candidates, COMMANDS, type Env, run, toHTML } from '../../src/components/home/terminal/commands';
import { terminalData } from '../../src/components/home/terminal/data';
import { closest, commonPrefix, completionTarget, stepHistory, suggest, tokenize } from '../../src/components/home/terminal/editor';
import { neofetchHTML, rows } from '../../src/components/home/terminal/neofetch';
import { COLS, frame, initials, REST_ANGLE, ROWS } from '../../src/components/home/terminal/spinner';
import { tenure } from '../../src/components/home/tenure';

const profile = {
  name: 'Ana María López',
  role: 'Backend Engineer',
  description: 'I build <APIs>. More at https://example.com/ana',
  location: 'Lima, PE',
  timeZone: 'America/Lima',
  languages: 'Spanish, English',
  careerStart: '2024-04',
  links: [
    { label: 'GitHub', url: 'https://github.com/ana' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/ana' },
  ],
};
const experience = [
  { id: 'old', body: 'Taught classes.', data: { role: 'Teaching Assistant', org: 'Big State University', start: '2020-02', end: '2020-12', place: 'Lima, PE', stack: [] } },
  { id: 'acme', body: 'Builds APIs.\n\n- Shipped <payments>.', data: { role: 'Backend Engineer', org: 'Acme', start: '2024-04', place: 'Lima, PE', stack: ['Python', 'AWS'] } },
  { id: 'lab', body: 'Runs the lab.', data: { role: 'Lab Assistant', org: 'Tech School', start: '2025-01', place: 'Lima, PE', stack: ['Python', 'C'] } },
];
const education = [
  { id: 'cs', body: 'A degree.', data: { title: 'B.Sc. in Computer Science', school: 'Big State University', start: '2016-03', end: '2020-12', thesis: 'On <queues>.' } },
];
const certificates = [
  { data: { name: 'Old Cert', issuer: 'Acme', year: 2021 } },
  { data: { name: 'Spanish', issuer: 'DELE', year: 2025 } },
  { data: { name: 'English', issuer: 'EF SET', year: 2025 } },
];
const projects = [
  { id: 'relay', body: '## Why\n\nRetries.', data: { title: 'Webhook <relay>', summary: 'Relays events.', year: 2025, context: 'Work' as const, domains: ['Backend' as const], order: 2, live: true, confidential: false, stack: ['Go'], links: [{ label: 'Source', url: 'https://github.com/ana/relay' }] } },
  { id: 'site', body: '', data: { title: 'This site', summary: 'A site.', year: 2026, context: 'Personal' as const, domains: ['Backend' as const], order: 1, live: false, confidential: false, stack: [], links: [] } },
];
const publications = [
  { data: { title: 'Colas en la práctica', language: 'Spanish', authors: ['Ana María López', 'Bo Chen'], venue: 'Some Conference', year: 2024, file: 'queues.pdf' } },
];
const content = { profile, experience, education, certificates, publications, projects };
const COMMIT = 'abc1234def5678abc1234def5678abc1234def56';
const NOW = new Date(Date.UTC(2026, 10, 12, 14, 14));

function makeEnv(commit: string | null = COMMIT) {
  const data = terminalData(content, commit);
  const opened: string[] = [];
  const env: Env = {
    home: data.home,
    cwd: [],
    setCwd: (p) => {
      env.cwd = p;
    },
    history: [],
    status: 0,
    info: data.info,
    commit: data.commit,
    now: () => NOW,
    open: (href) => opened.push(href),
    clear: () => {},
  };
  return { env, opened };
}

describe('spinner', () => {
  it('takes the initials of the first and last names, without accents', () => {
    expect(initials('Ana María López')).toBe('AL');
    expect(initials('Élodie')).toBe('E');
    expect(initials('  ')).toBe('');
  });
  it('draws ROWS lines of COLS characters', () => {
    const lines = frame('AL', REST_ANGLE).split('\n');
    expect(lines).toHaveLength(ROWS);
    for (const l of lines) expect(l).toHaveLength(COLS);
    expect(frame('AL', REST_ANGLE).trim()).not.toBe('');
  });
  it('changes with the angle and the letters', () => {
    expect(frame('AL', 0)).not.toBe(frame('AL', 1));
    expect(frame('AL', 0.5)).toBe(frame('AL', 0.5));
    expect(frame('JA', 0)).not.toBe(frame('AL', 0));
    expect(frame('', 0).trim()).toBe('');
  });
});

describe('neofetch', () => {
  const { info } = terminalData(content, COMMIT);
  it('derives the login and initials from the name', () => {
    expect(info).toMatchObject({ user: 'ana', initials: 'AL' });
  });
  it('lists the profile in order, with the local clock and its zone', () => {
    expect(rows(info, NOW, true).map((r) => [r.key, r.text])).toEqual([
      ['Role', 'Backend Engineer'],
      ['Uptime', '2+ years in software engineering'],
      ['Stack', 'Python, AWS, C'],
      ['Based', 'Lima, PE · 09:14 (GMT-5)'],
      ['Education', 'B.Sc. in Computer Science'],
      ['Languages', 'Spanish, English'],
      ['Links', 'github · linkedin'],
      ['Packages', '2 projects'],
    ]);
  });
  it('leaves out the clock at build time and rows without data', () => {
    const r = rows({ ...info, languages: undefined, careerStart: undefined, stack: [], education: undefined, links: [], projects: 0 }, NOW);
    expect(r.map((x) => [x.key, x.text])).toEqual([['Role', 'Backend Engineer'], ['Based', 'Lima, PE']]);
  });
  it('says under a year for a new career', () => {
    expect(rows({ ...info, careerStart: '2026-06' }, NOW)[1].text).toBe('under a year in software engineering');
  });
  it('escapes content and links the profile links', () => {
    const html = neofetchHTML({ ...info, role: '<b>Engineer</b>' }, NOW, 'art');
    expect(html).toContain('&lt;b&gt;Engineer&lt;/b&gt;');
    expect(html).toContain('<a href="https://github.com/ana" target="_blank" rel="noopener">github</a>');
    expect(html).toContain('ana</span>@<span class="c-acc b">ubuntu');
  });
});

describe('experience', () => {
  it('orders current roles longest-running first, then past roles by most recent end', () => {
    const order = [...experience].sort((a, b) => byRecency(a.data, b.data)).map((r) => r.id);
    expect(order).toEqual(['acme', 'lab', 'old']);
  });
  it('makes a monogram from the capitalized words, or the first letters of one', () => {
    expect(monogram('Universidad de la Defensa Nacional')).toBe('UD');
    expect(monogram('Infiniem Labs')).toBe('IL');
    expect(monogram('Mecantronic')).toBe('ME');
  });
  it('collects the current stack once, in role order', () => {
    expect(currentStack(experience.map((r) => r.data))).toEqual(['Python', 'AWS', 'C']);
  });
  it('labels months', () => {
    expect(monthLabel('2025-03')).toBe('Mar 2025');
  });
});

describe('tenure', () => {
  it('measures a closed period in years, counting both months', () => {
    expect(tenure('2021-03', '2022-12', NOW).years).toBeCloseTo(22 / 12, 5);
  });
  it('uses now for an open period', () => {
    expect(tenure('2026-01', null, NOW).years).toBeCloseTo(11 / 12, 5);
  });
});

describe('line editor', () => {
  const history = ['cat about.md', 'ls', 'cat .bashrc'];
  it('suggests the newest history match, then a common command', () => {
    expect(suggest('cat', history, [])).toBe(' .bashrc');
    expect(suggest('ne', history, ['neofetch'])).toBe('ofetch');
    expect(suggest('', history, ['help'])).toBe('');
    expect(suggest('ls', history, [])).toBe('');
  });
  it('steps through history filtered by the typed prefix and restores the draft', () => {
    const up = stepHistory(history, null, 'cat', -1)!;
    expect(up.value).toBe('cat .bashrc');
    const up2 = stepHistory(history, up.cursor, up.value, -1)!;
    expect(up2.value).toBe('cat about.md');
    expect(stepHistory(history, up2.cursor, up2.value, -1)).toBeNull();
    const down = stepHistory(history, up2.cursor, up2.value, 1)!;
    expect(down.value).toBe('cat .bashrc');
    expect(stepHistory(history, down.cursor, down.value, 1)).toEqual({ cursor: null, value: 'cat' });
  });
  it('finds the word to complete in the last pipe stage', () => {
    expect(completionTarget('cat about.md | gr', 17)).toEqual({ words: ['gr'], cur: 'gr', start: 15 });
    expect(completionTarget('cat ab', 6)).toEqual({ words: ['cat', 'ab'], cur: 'ab', start: 4 });
  });
  it('tokenizes quotes, shares prefixes and catches typos', () => {
    expect(tokenize(`grep "build APIs" about.md`)).toEqual(['grep', 'build APIs', 'about.md']);
    expect(commonPrefix(['pwd', 'projects/'])).toBe('p');
    expect(closest('catt', ['cat', 'cd'])).toBe('cat');
    expect(closest('xyz', ['cat', 'cd'])).toBeUndefined();
  });
});

describe('commands', () => {
  it('help lists the commands', () => {
    const { env } = makeEnv();
    const out = run('help', env).text!;
    expect(out).toMatch(/^Commands\n/);
    expect(out).toContain('git log');
    expect(out).not.toMatch(/curl|access\.log/);
  });
  it('ls, cd and pwd walk the content as files under the login home', () => {
    const { env } = makeEnv();
    expect(run('ls', env).text).toBe('about.md\neducation\nexperience\nprojects');
    expect(run('ls -a', env).text).toContain('.bashrc');
    expect(run('ls -l', env).text).toContain('ana ana');
    expect(run('pwd', env).text).toBe('/home/ana');
    expect(run('cd nowhere', env)).toEqual({ text: 'bash: cd: nowhere: No such file or directory', status: 1 });
    expect(run('cd about.md', env)).toEqual({ text: 'bash: cd: about.md: Not a directory', status: 1 });
  });
  it('experience/ holds one file per role, newest first, each opening its entry', () => {
    const { env, opened } = makeEnv();
    expect(run('ls experience', env).text).toBe('acme.md\nlab.md\nold.md');
    expect(run('cat experience/acme.md', env).text).toBe('# Backend Engineer\nAcme · Lima, PE · 2024-04 to now\n\nBuilds APIs.\n\n- Shipped <payments>.\n\n- Python, AWS');
    run('open experience/acme.md', env);
    run('open experience', env);
    expect(opened).toEqual(['/#exp-acme', '/#experience']);
  });
  it('education/ holds each degree and the certificates, newest first', () => {
    const { env, opened } = makeEnv();
    expect(run('ls education', env).text).toBe('certificates.txt\ncs.md\npapers.txt');
    expect(run('cat education/papers.txt', env).text).toBe('Colas en la práctica\nAna María López, Bo Chen · Some Conference 2024 · in Spanish');
    expect(run('cat education/cs.md', env).text).toBe('# B.Sc. in Computer Science\nBig State University · 2016-03 to 2020-12\n\nA degree.\n\nThesis: On <queues>.');
    expect(run('cat education/certificates.txt', env).text!.split('\n').map((l) => l.split(/\s{2,}/)[0])).toEqual(['English', 'Spanish', 'Old Cert']);
    run('open education/certificates.txt', env);
    expect(opened).toEqual(['/#edu-certs']);
  });
  it('projects/ holds one file per project in home order, each opening its page', () => {
    const { env, opened } = makeEnv();
    expect(run('ls projects', env).text).toBe('relay.md\nsite.md');
    expect(run('cat projects/relay.md', env).text).toBe('# Webhook <relay>\n2025 · Work · Backend · live\n\nRelays events.\n\n## Why\n\nRetries.\n\n- Go\n- Source: https://github.com/ana/relay');
    expect(run('cat projects/site.md', env).text).toBe('# This site\n2026 · Personal · Backend\n\nA site.');
    run('open projects/relay.md', env);
    expect(opened).toEqual(['/projects/relay']);
  });
  it('cat prints content escaped and linkified', () => {
    const { env } = makeEnv();
    const res = run('cat about.md', env);
    expect(res.text).toBe('# About\nAna María López · Backend Engineer · Lima, PE\n\nI build <APIs>. More at https://example.com/ana');
    expect(toHTML(res)).toContain('I build &lt;APIs&gt;');
    expect(toHTML(res)).toContain('<a href="https://example.com/ana"');
  });
  it('pipes text through grep, wc and head', () => {
    const { env } = makeEnv();
    expect(run('cat about.md | grep -c Lima', env).text).toBe('1');
    expect(run('cat about.md | wc -l', env).text!.trim()).toBe('4');
    expect(run('cat .bashrc | head -n 1', env).text).toBe('# ~/.bashrc');
    expect(run('cat about.md | jq .name', env).status).toBe(127);
  });
  it('unknown commands suggest a close one', () => {
    const { env } = makeEnv();
    const res = run('catt about.md', env);
    expect(res.status).toBe(127);
    expect(res.text).toBe('catt: command not found');
    expect(res.html).toContain('did you mean cat?');
  });
  it('open goes to the profile links by name', () => {
    const { env, opened } = makeEnv();
    run('open github', env);
    expect(opened).toEqual(['https://github.com/ana']);
    expect(run('open about.md', env).status).toBe(1);
    expect(run('open', env).text).toBe('usage: open <file | github | linkedin>');
  });
  it('git log shows the commit this page was built from, or fails without one', () => {
    expect(run('git log', makeEnv().env).text).toBe(`commit ${COMMIT} (HEAD)`);
    expect(run('git status', makeEnv().env).text).toContain('HEAD detached at abc1234');
    expect(run('git log', makeEnv(null).env).status).toBe(128);
  });
  it('completes commands, files and link names, never hidden commands', () => {
    const { env } = makeEnv();
    const values = (words: string[], cur: string) => candidates(env, words, cur).map((c) => c.value).filter((v) => v.startsWith(cur));
    expect(values(['cat', 'ab'], 'ab')).toEqual(['about.md']);
    expect(values(['cd', 'e'], 'e')).toEqual(['education/', 'experience/']);
    expect(values(['open', 'g'], 'g')).toEqual(['github']);
    expect(values(['m'], 'm')).toEqual(['man']);
    expect(values(['m'], 'm')).not.toContain('mv');
    expect(Object.keys(COMMANDS)).toContain('mv');
  });
  it('rm and mv fail like on a read-only file system', () => {
    const { env } = makeEnv();
    expect(run('rm -rf about.md', env)).toEqual({ text: "rm: cannot remove 'about.md': Read-only file system", status: 1 });
    expect(run('mv about.md x.md', env).text).toBe("mv: cannot move 'about.md' to 'x.md': Read-only file system");
  });
});
