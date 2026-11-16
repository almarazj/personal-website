import { execSync } from 'node:child_process';
import pkg from '../../package.json';

/** The commit the site is built from, read at build time; null without a git checkout. */
export const commit: string | null = (() => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
})();

export const repoUrl = `https://github.com/${pkg.repository.replace(/^github:/, '')}`;
