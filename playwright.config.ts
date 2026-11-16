import { defineConfig } from '@playwright/test';

// E2E_PORT lets the suite run beside a dev server on 4321.
const port = Number(process.env.E2E_PORT ?? 4321);

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
  },
});
