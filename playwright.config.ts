import { defineConfig } from '@playwright/test';

// Off Astro's default 4321 so the suite runs beside a dev server; E2E_PORT overrides it.
const port = Number(process.env.E2E_PORT ?? 4322);

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'on-first-retry' },
  webServer: {
    // Tests run against the built site, the same files that ship to S3.
    // --ignore-lock keeps preview in the foreground; under a coding agent Astro would background it and exit.
    command: `pnpm build && pnpm preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Builds as a tag-triggered CodeBuild run does, so the footer shows a release.
    env: { CODEBUILD_WEBHOOK_TRIGGER: 'tag/v0.0.0-e2e' },
  },
});
