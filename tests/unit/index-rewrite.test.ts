import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The CloudFront Function lives inline in the template; this runs that exact code.
const template = readFileSync(new URL('../../infra/site.yml', import.meta.url), 'utf8');
const code = template.match(/FunctionCode: \|\n((?: {8}.*\n)+)/)![1];
type Request = { uri: string; headers: Record<string, { value: string }> };
type Redirect = { statusCode: number; headers: { location: { value: string } } };
const handler = new Function(`${code}; return handler;`)() as (e: { request: Request }) => Request | Redirect;
const run = (uri: string, host = 'example.dev') => handler({ request: { uri, headers: { host: { value: host } } } });
const rewrite = (uri: string) => (run(uri) as Request).uri;

describe('index rewrite', () => {
  it('serves directory paths from their index.html, with or without the trailing slash', () => {
    expect(rewrite('/')).toBe('/index.html');
    expect(rewrite('/projects/relay')).toBe('/projects/relay/index.html');
    expect(rewrite('/projects/relay/')).toBe('/projects/relay/index.html');
  });
  it('redirects www to the apex, keeping the path', () => {
    expect(run('/projects/relay', 'www.example.dev')).toMatchObject({
      statusCode: 301,
      headers: { location: { value: 'https://example.dev/projects/relay' } },
    });
  });
  it('leaves files alone', () => {
    expect(rewrite('/_astro/logo.Ab12.webp')).toBe('/_astro/logo.Ab12.webp');
    expect(rewrite('/404.html')).toBe('/404.html');
  });
});
