import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The CloudFront Function lives inline in the template; this runs that exact code.
const template = readFileSync(new URL('../../infra/site.yml', import.meta.url), 'utf8');
const code = template.match(/FunctionCode: \|\n((?: {8}.*\n)+)/)![1];
const handler = new Function(`${code}; return handler;`)() as (e: { request: { uri: string } }) => { uri: string };
const rewrite = (uri: string) => handler({ request: { uri } }).uri;

describe('index rewrite', () => {
  it('serves directory paths from their index.html, with or without the trailing slash', () => {
    expect(rewrite('/')).toBe('/index.html');
    expect(rewrite('/projects/relay')).toBe('/projects/relay/index.html');
    expect(rewrite('/projects/relay/')).toBe('/projects/relay/index.html');
  });
  it('leaves files alone', () => {
    expect(rewrite('/_astro/logo.Ab12.webp')).toBe('/_astro/logo.Ab12.webp');
    expect(rewrite('/404.html')).toBe('/404.html');
  });
});
